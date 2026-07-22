<script setup lang="ts">
import * as live2d from 'live2d-render';
import { useProfileStore } from "@/stores/profileStore";
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useSnackbarStore } from "@/stores/snackbarStore";
import AnimationChat from "@/components/animations/AnimationChat1.vue";
import { countAndCompleteCodeBlocks } from "@/utils/aiUtils";
import { scrollToBottom } from "@/utils/common";
import { MdPreview } from "md-editor-v3";
import { useChatGPTStore } from "@/stores/chatGPTStore";
import "md-editor-v3/lib/preview.css";
import ApiKeyDialog from "@/components/ApiKeyDialog.vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const profileStore = useProfileStore();
const signon = reactive({ ...profileStore.signon });
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

interface Message {
  content: string;
  role: "user" | "assistant" | "system";
  streaming?: boolean; // 标记是否正在流式输出
  activity?: string;
}

interface Session {
  id: number;
  title: string;
  updated_at: string;
}

// 核心状态
const userMessage = ref("");
const messages = ref<Message[]>([]);
const isLoading = ref(false);

// 会话管理
const sessionList = ref<Session[]>([]);
const currentSessionId = ref<number | null>(null);
const drawer = ref(true);

// 流式控制
const abortController = ref<AbortController | null>(null);
const currentRequestId = ref<string | null>(null);

const BASE_URL = '/api/v1/chat-ai';

const axiosInstance = axios.create({ baseURL: BASE_URL });

// ============================================================
// Token 工具
// ============================================================
const isValidToken = (val: any): val is string => {
  return typeof val === 'string' && val.length > 10
    && val !== 'undefined' && val !== 'null' && val !== '';
};

const getToken = (): string | null => {
  if (isValidToken(authStore.token)) return authStore.token;
  for (const key of ['token', 'accessToken', 'userToken']) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    if (isValidToken(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      const candidate = parsed?.token ?? parsed?.accessToken ?? parsed?.value;
      if (isValidToken(candidate)) return candidate;
    } catch {}
  }
  return null;
};

axiosInstance.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// ============================================================
// 会话管理
// ============================================================
const fetchSessions = async () => {
  try {
    const res = await axiosInstance.get('/sessions');
    if (res.data.code === 200) sessionList.value = res.data.data;
  } catch (error) {
    console.error("拉取会话列表失败", error);
  }
};

const loadSession = async (sessionId: number) => {
  if (currentSessionId.value === sessionId) return;
  currentSessionId.value = sessionId;
  messages.value = [];
  isLoading.value = true;
  try {
    const res = await axiosInstance.get(`/sessions/${sessionId}/messages`);
    if (res.data.code === 200) {
      messages.value = res.data.data.map((m: any) => ({
        role: m.role,
        content: m.content,
        streaming: false
      }));
    }
  } catch (error) {
    snackbarStore.showErrorMessage("加载历史记录失败");
  } finally {
    isLoading.value = false;
  }
};

const createNewChat = () => {
  currentSessionId.value = null;
  messages.value = [];
};

// ============================================================
// 删除会话
// ============================================================
const deleteDialog = ref(false);
const sessionToDelete = ref<Session | null>(null);

const confirmDeleteSession = (session: Session) => {
  sessionToDelete.value = session;
  deleteDialog.value = true;
};

const executeDelete = async () => {
  if (!sessionToDelete.value) return;
  const sessionId = sessionToDelete.value.id;
  try {
    const res = await axiosInstance.delete(`/sessions/${sessionId}`);
    if (res.data.code === 200) {
      snackbarStore.showSuccessMessage("会话已删除");
      if (currentSessionId.value === sessionId) {
        createNewChat();
      }
      await fetchSessions();
    } else {
      snackbarStore.showErrorMessage(res.data.message || "删除失败");
    }
  } catch (error) {
    snackbarStore.showErrorMessage("删除失败，请稍后重试");
  } finally {
    deleteDialog.value = false;
    sessionToDelete.value = null;
  }
};

// ============================================================
// 核心：流式发送消息
// ============================================================
const sendMessage = async () => {
  if (!userMessage.value.trim() || isLoading.value) return;

  const currentMsg = userMessage.value;
  messages.value.push({ content: currentMsg, role: "user", streaming: false });
  userMessage.value = "";
  isLoading.value = true;

  // 添加一条空的 assistant 消息，用于实时填充流式内容
  const assistantMsgIndex = messages.value.length;
  messages.value.push({
    content: "",
    role: "assistant",
    streaming: true,
    activity: "正在思考中"
  });

  // 终止上一个请求（如果有）
  if (abortController.value) abortController.value.abort();
  abortController.value = new AbortController();
  const requestId = crypto.randomUUID();
  currentRequestId.value = requestId;

  const token = getToken();

  try {
    // 使用 fetch API 实现 SSE 流式读取
    const response = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: currentMsg,
        session_id: currentSessionId.value,
        request_id: requestId
      }),
      signal: abortController.value.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let completed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按 SSE 格式解析（每条消息以 \n\n 结尾）
      buffer = buffer.replace(/\r\n/g, '\n');
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 未完成的部分留到下次

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);

          if (data.type === 'start') {
            if (!currentSessionId.value && data.session_id) {
              currentSessionId.value = data.session_id;
            }

          } else if (data.type === 'status') {
            messages.value[assistantMsgIndex].activity = data.label || '正在思考中';

          } else if (data.type === 'chunk') {
            // 实时追加内容
            messages.value[assistantMsgIndex].content += data.content;
            messages.value[assistantMsgIndex].activity = undefined;
            await nextTick();
            scrollToBottom(document.querySelector(".message-container"));

          } else if (data.type === 'done') {
            // 流式结束
            messages.value[assistantMsgIndex].streaming = false;
            messages.value[assistantMsgIndex].activity = undefined;
            completed = true;
            if (!currentSessionId.value && data.session_id) {
              currentSessionId.value = data.session_id;
            }
            await fetchSessions();

          } else if (data.type === 'error') {
            messages.value[assistantMsgIndex].content = data.message || 'AI 服务暂时不可用，请稍后重试。';
            messages.value[assistantMsgIndex].streaming = false;
            messages.value[assistantMsgIndex].activity = undefined;
            completed = true;

          } else if (data.type === 'cancelled') {
            messages.value[assistantMsgIndex].content = '已停止生成。';
            messages.value[assistantMsgIndex].streaming = false;
            messages.value[assistantMsgIndex].activity = undefined;
            completed = true;
          }
        } catch (e) {
          console.warn('SSE JSON 解析失败:', jsonStr);
        }
      }
    }

    if (!completed) {
      throw new Error('SSE stream ended before completion');
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      messages.value[assistantMsgIndex].content = '已停止生成。';
    } else {
      console.error('流式请求失败:', error);
      messages.value[assistantMsgIndex].content = '连接中断，请稍后重新发送。';
    }
    messages.value[assistantMsgIndex].streaming = false;
    messages.value[assistantMsgIndex].activity = undefined;
  } finally {
    isLoading.value = false;
    abortController.value = null;
    currentRequestId.value = null;
  }
};

// 停止生成
const stopGeneration = async () => {
  const requestId = currentRequestId.value;
  if (requestId) {
    try {
      await axiosInstance.post(`/runs/${requestId}/cancel`);
    } catch (error) {
      console.warn('停止后端生成失败:', error);
    }
  }
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
};

// ============================================================
// 监听滚动 + live2d 联动
// ============================================================
watch(() => messages.value, (val) => {
  if (val) {
    nextTick(() => {
      scrollToBottom(document.querySelector(".message-container"));
    });
    const last = val[val.length - 1];
    // 只在完整消息出来后触发 live2d（不在流式过程中）
    if (last?.role === "assistant" && last.content && !last.streaming) {
      try {
        const firstSentence = last.content.split(/(?<=[。！？\n.?!])\s*/)[0];
        setTimeout(() => {
          live2d.setMessageBox(firstSentence || last.content.slice(0, 50), 4000);
        }, 100);
      } catch (e) {}
    }
  }
}, { deep: true });

// 安全兜底：过滤可能的思考过程残留（后端 primary filter 已经跳过 ToolMessage 和 tool_calls）
// 这里只处理极端情况下可能泄露的 JSON 块和 Final Answer 标记
const filterThinkingContent = (text: string): string => {
  if (!text) return '';

  // 如果包含 Final Answer 标记，只取其后内容
  const faIdx = text.indexOf('Final Answer:') !== -1
    ? text.indexOf('Final Answer:')
    : text.indexOf('Final Answer：');
  if (faIdx !== -1) {
    const marker = text.indexOf('Final Answer:') !== -1 ? 'Final Answer:' : 'Final Answer：';
    return text.slice(faIdx + marker.length).trim();
  }

  // 移除工具调用返回的 JSON 块（安全兜底）
  // 匹配 {"key": ...} 格式，只删除明显的 JSON，不影响正常回复中的引号
  let cleaned = text;
  const jsonBlock = /\{\s*"[^"]+"\s*:\s*[\[{"].*?\}\s*\}/gs;
  const before = cleaned;
  cleaned = cleaned.replace(jsonBlock, '');
  // 如果删除 JSON 后只剩空白，返回空让下方兜底
  if (before !== cleaned && cleaned.trim() === '') {
    return '';
  }

  return cleaned.trim();
};

const displayMessages = computed(() => {
  if (messages.value.length === 0) return [];

  return messages.value.map(msg => {
    let content = msg.content;

    if (msg.role === 'assistant') {
      content = filterThinkingContent(content);
    }

    return {
      ...msg,
      content: countAndCompleteCodeBlocks(content),
    };
  });
});

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
    e.preventDefault();
    userMessage.value += "\n";
  } else if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

const inputRow = ref(1);

// ============================================================
// 生命周期
// ============================================================
let tokenPollTimer: ReturnType<typeof setInterval> | null = null;

const initSessionsWhenReady = () => {
  if (getToken()) { fetchSessions(); return; }
  let attempts = 0;
  tokenPollTimer = setInterval(() => {
    attempts++;
    if (getToken()) {
      fetchSessions();
      clearInterval(tokenPollTimer!);
      tokenPollTimer = null;
    } else if (attempts >= 10) {
      clearInterval(tokenPollTimer!);
      tokenPollTimer = null;
    }
  }, 500);
};

onMounted(() => {
  initSessionsWhenReady();
  try {
    setTimeout(() => {
      live2d.setMessageBox("欢迎！左侧可以选择您的历史对话哦~", 4000);
    }, 1500);
  } catch (error) {}
});

onUnmounted(() => {
  if (tokenPollTimer) clearInterval(tokenPollTimer);
  if (abortController.value) abortController.value.abort();
  window.onresize = null;
});
</script>


<template>
  <div class="chat-bot-wrapper d-flex h-100">
    
    <!-- 左侧历史会话栏 -->
    <v-navigation-drawer 
      v-model="drawer"
      permanent
      width="260"
      class="bg-grey-lighten-4 border-r"
    >
      <div class="pa-4">
        <v-btn 
          color="primary" 
          block 
          prepend-icon="mdi-plus" 
          @click="createNewChat"
        >
          新建对话
        </v-btn>
      </div>
      
      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-subheader>历史会话</v-list-subheader>
        
        <v-list-item
          v-for="session in sessionList"
          :key="session.id"
          :value="session.id"
          :active="currentSessionId === session.id"
          color="primary"
          @click="loadSession(session.id)"
        >
          <template v-slot:prepend>
            <v-icon>mdi-message-outline</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ session.title }}
          </v-list-item-title>
          <v-list-item-subtitle style="font-size: 0.75rem;">
            {{ session.updated_at.split(' ')[0] }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-btn
              icon
              variant="text"
              size="small"
              color="grey"
              @click.stop="confirmDeleteSession(session)"
              title="删除此对话"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <!-- 删除确认对话框 -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">确认删除</v-card-title>
          <v-card-text>
            确定要删除对话「<strong>{{ sessionToDelete?.title }}</strong>」吗？删除后不可恢复。
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
            <v-btn color="error" variant="elevated" @click="executeDelete">
              <v-icon start>mdi-delete</v-icon>
              删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-navigation-drawer>

    <!-- 右侧聊天区 -->
    <div class="chat-bot flex-grow-1 position-relative">
      <div class="messsage-area">
        <perfect-scrollbar v-if="messages.length > 0" class="message-container">
          <template v-for="(message, index) in displayMessages" :key="index">
            
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" class="pa-4 user-message">
              <v-avatar class="ml-4" rounded="sm" variant="elevated">
                <img :src="signon.avatarUrl" alt="user" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-text><b>{{ message.content }}</b></v-card-text>
              </v-card>
            </div>

            <!-- AI 消息 -->
            <div v-else class="pa-2 pa-md-5 assistant-message">
              <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="bot" />
              </v-avatar>
              <div class="assistant-content-wrapper">
                <v-card>
                  <!-- 正在流式输出时显示内容 + 光标动画 -->
                  <div v-if="message.streaming" class="streaming-wrapper">
                    <div v-if="message.activity && !message.content" class="agent-activity">
                      <v-progress-circular indeterminate size="18" width="2" color="primary" />
                      <span>{{ message.activity }}</span>
                    </div>
                    <md-preview :modelValue="message.content" class="font-1" />
                    <span v-if="message.content" class="streaming-cursor">▋</span>
                  </div>
                  <!-- 完成后正常渲染 -->
                  <md-preview v-else :modelValue="message.content" class="font-1" />
                </v-card>
              </div>
            </div>
          </template>
          
        </perfect-scrollbar>
        
        <div class="no-message-container" v-else>
          <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">智能房产推荐</h1>
          <AnimationChat :size="300" />
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <v-sheet color="transparent" elevation="0" class="input-panel d-flex align-end pa-1">
          <v-btn class="mb-1 mr-2 d-md-none" variant="elevated" icon @click="drawer = !drawer">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
          
          <v-btn class="mb-1" variant="elevated" icon @click="chatGPTStore.configDialog = true">
            <v-icon size="30" class="text-primary">mdi-cog-outline</v-icon>
          </v-btn>
          
          <v-textarea
            class="mx-2" color="primary" clearable variant="solo"
            v-model="userMessage" placeholder="找房需求，直接告诉我..."
            hide-details @keydown="handleKeydown" :rows="inputRow"
            @focus="inputRow = 3" @blur="inputRow = 1" :disabled="isLoading"
          ></v-textarea>

          <!-- 发送/停止 按钮切换 -->
          <v-btn
            v-if="!isLoading"
            class="mb-1" color="primary" variant="elevated" icon @click="sendMessage"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
          <v-btn
            v-else
            class="mb-1" color="error" variant="elevated" icon @click="stopGeneration"
            title="停止生成"
          >
            <v-icon>mdi-stop</v-icon>
          </v-btn>
        </v-sheet>
        <ApiKeyDialog />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-bot-wrapper {
  overflow: hidden;
}

.chat-bot {
  background: radial-gradient(circle at top right, rgba(207, 93, 62, .10), transparent 32%), var(--house-paper);
  height: 100%;
  display: flex;
  flex-direction: column;

  .messsage-area {
    flex: 1;
    height: 100%;
  }

  .input-area {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 1rem;
    align-items: center;

    .input-panel {
      border: 1px solid var(--house-line);
      border-radius: 18px;
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(10px);
    }
  }
}

.user-message {
  display: flex;
  align-content: center;
  justify-content: end;
  flex-direction: row-reverse;
}

.assistant-message {
  display: flex;
  align-content: center;
  justify-content: start;
  flex-direction: row;
}

.assistant-content-wrapper {
  flex: 1;
  max-width: calc(100% - 60px);
}

.message {
  margin: 0 auto;
  max-width: 1200px;
  display: flex;
}

.message-container {
  height: calc(100vh - 154px);
  padding-bottom: 80px;
}

.no-message-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  h1 {
    font-size: 2rem;
    font-weight: 500;
  }
}

// 流式输出容器
.streaming-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.agent-activity {
  align-items: center;
  display: flex;
  gap: 8px;
  min-height: 40px;
  padding: 12px 16px;
}

// 流式光标动画
.streaming-cursor {
  display: inline-block;
  color: rgb(var(--v-theme-primary));
  font-weight: bold;
  animation: blink 0.8s step-end infinite;
  margin-left: 2px;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

:deep(.md-editor-preview-wrapper) {
  padding: 5px 15px;
}

.font-1 {
  font-size: 13px !important;
}
</style>
