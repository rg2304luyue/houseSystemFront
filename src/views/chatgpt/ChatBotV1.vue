<script setup lang="ts">
import * as live2d from 'live2d-render';
import { useProfileStore } from "@/stores/profileStore";
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useSnackbarStore } from "@/stores/snackbarStore";
import AnimationChat from "@/components/animations/AnimationChat1.vue";
import AnimationAi from "@/components/animations/AnimationBot1.vue";
import { countAndCompleteCodeBlocks } from "@/utils/aiUtils";
import { scrollToBottom } from "@/utils/common";
import { MdPreview } from "md-editor-v3";
import { useChatGPTStore } from "@/stores/chatGPTStore";
import "md-editor-v3/lib/preview.css";
import ApiKeyDialog from "@/components/ApiKeyDialog.vue";
import { userTokenStore } from "@/stores/token";

const profileStore = useProfileStore();
const signon = reactive({ ...profileStore.signon });
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

interface Message {
  content: string;
  role: "user" | "assistant" | "system";
}

interface Session {
  id: number;
  title: string;
  updated_at: string;
}

// 核心状态管理
const userMessage = ref("");
const messages = ref<Message[]>([]);
const isLoading = ref(false);

// 新增：会话管理状态
const sessionList = ref<Session[]>([]);
const currentSessionId = ref<number | null>(null);
const drawer = ref(true); // 控制左侧边栏是否展开

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/chat-ai'
});

// 添加请求拦截器，确保每次聊天都带着身份令牌
axiosInstance.interceptors.request.use(config => {
  // Use the store to get the token, falling back to localStorage if necessary
  const tokenStore = userTokenStore();
  let token = tokenStore.token;

  if (!token) {
    // Fallback: Try to get it from localStorage directly
    const storedItem = localStorage.getItem('token');
    if (storedItem) {
        // Try to parse it if it's a JSON object (common with Pinia persistence)
        try {
             const parsed = JSON.parse(storedItem);
             token = parsed.token || storedItem; // Use parsed.token if it exists, else the whole string
        } catch (e) {
             token = storedItem; // It wasn't JSON, use the string directly
        }
    }
  }

  // Final cleanup: remove quotes if they accidentally got wrapped
  if (typeof token === 'string' && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Sending token:", token); // <-- Add this for debugging!
  } else {
    console.error("No token found! The request will likely fail with 401.");
  }

  return config;
}, error => {
    return Promise.reject(error);
});

// 1. 初始化拉取会话列表
const fetchSessions = async () => {
  try {
    const res = await axiosInstance.get('/sessions');
    if (res.data.code === 200) {
      sessionList.value = res.data.data;
    }
  } catch (error) {
    console.error("拉取会话列表失败", error);
  }
};

// 2. 点击左侧会话：加载具体聊天记录
const loadSession = async (sessionId: number) => {
  if (currentSessionId.value === sessionId) return;
  
  currentSessionId.value = sessionId;
  messages.value = []; // 清空当前屏幕
  isLoading.value = true;
  
  try {
    const res = await axiosInstance.get(`/sessions/${sessionId}/messages`);
    if (res.data.code === 200) {
      // 将后端返回的格式转换为前端显示的格式
      messages.value = res.data.data.map((m: any) => ({
        role: m.role,
        content: m.content
      }));
    }
  } catch (error) {
    snackbarStore.showErrorMessage("加载历史记录失败");
  } finally {
    isLoading.value = false;
  }
};

// 3. 点击“新建对话”
const createNewChat = () => {
  currentSessionId.value = null;
  messages.value = [];
};

// 4. 发送消息
const sendMessage = async () => {
  if (!userMessage.value.trim() || isLoading.value) return;

  const currentMsg = userMessage.value;
  messages.value.push({ content: currentMsg, role: "user" });
  userMessage.value = "";
  isLoading.value = true;
  
  try {
    // 【重要】我们不再发送庞大的 history 数组，只发送 message 和 currentSessionId
    const response = await axiosInstance.post('/chat', {
      message: currentMsg,
      session_id: currentSessionId.value
    });

    if (response.data.code === 200) {
      const data = response.data.data;
      messages.value.push({
        content: data.reply,
        role: "assistant",
      });
      
      // 如果这是一个新对话，后端会返回新创建的 session_id
      if (!currentSessionId.value) {
        currentSessionId.value = data.session_id;
      }
      
      // 发送完消息后刷新左侧列表，确保标题和排序是最新的
      await fetchSessions();
    } else {
      snackbarStore.showErrorMessage(response.data.message);
    }
  } catch (error: any) {
    snackbarStore.showErrorMessage("网络异常，请稍后再试");
  } finally {
    isLoading.value = false;
  }
};

watch(() => messages.value, (val) => {
  if (val) {
    scrollToBottom(document.querySelector(".message-container"));
    const last = val[val.length - 1];
    if (last?.role === "assistant" && last.content) {
      try {
        const firstSentence = last.content.split(/(?<=[。！？\n.?!])\s*/)[0];
        live2d.setMessageBox(firstSentence || last.content.slice(0, 50), 4000);
      } catch (e) {}
    }
  }
}, { deep: true });

const displayMessages = computed(() => {
  if (messages.value.length === 0) return [];
  const messagesCopy = messages.value.slice(); 
  const lastMessage = messagesCopy[messagesCopy.length - 1];
  messagesCopy[messagesCopy.length - 1] = {
    ...lastMessage,
    content: countAndCompleteCodeBlocks(lastMessage.content),
  };
  return messagesCopy;
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

onMounted(() => {
  fetchSessions(); // 页面加载时拉取历史记录列表
  try {
    setTimeout(() => {
      live2d.setMessageBox("欢迎！左侧可以选择您的历史对话哦~", 4000);
    }, 1000);
  } catch (error) {}
});

onUnmounted(() => {
  window.onresize = null; // 修复Live2D缩放报错
});
</script>

<template>
  <div class="chat-bot-wrapper d-flex h-100">
    
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
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div class="chat-bot flex-grow-1 position-relative">
      <div class="messsage-area">
        <perfect-scrollbar v-if="messages.length > 0" class="message-container">
          <template v-for="(message, index) in displayMessages" :key="index">
            <div v-if="message.role === 'user'" class="pa-4 user-message">
              <v-avatar class="ml-4" rounded="sm" variant="elevated">
                <img :src="signon.avatarUrl" alt="user" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-text><b>{{ message.content }}</b></v-card-text>
              </v-card>
            </div>
            <div v-else class="pa-2 pa-md-5 assistant-message">
              <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="bot" />
              </v-avatar>
              <v-card>
                <md-preview :modelValue="message.content" class="font-1" />
              </v-card>
            </div>
          </template>
          
          <div v-if="isLoading" class="pa-6">
            <div class="message"><AnimationAi :size="100" /></div>
          </div>
        </perfect-scrollbar>
        
        <div class="no-message-container" v-else>
          <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">智能房产推荐</h1>
          <AnimationChat :size="300" />
        </div>
      </div>

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

          <v-btn class="mb-1" color="primary" variant="elevated" icon :disabled="isLoading" @click="sendMessage">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </v-sheet>
        <ApiKeyDialog />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 在原来基础上新增了一层 wrapper 确保 flex 布局正常 */
.chat-bot-wrapper {
  overflow: hidden;
}

.chat-bot {
  background-repeat: repeat;
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
      border-radius: 5px;
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.9); /* 防止输入框被字挡住 */
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

.message {
  margin: 0 auto;
  max-width: 1200px;
  display: flex;
}

.message-container {
  height: calc(100vh - 154px);
  padding-bottom: 80px; /* 防止最后一条消息被输入框遮挡 */
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

:deep(.md-editor-preview-wrapper) {
  padding: 5px 15px;
}

.font-1 {
  font-size: 13px !important;
}
</style>
