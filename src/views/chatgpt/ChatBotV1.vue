<script setup lang="ts">
import * as live2d from 'live2d-render';
import { useProfileStore } from "@/stores/profileStore";
import { ref, reactive, computed, watch, onMounted } from 'vue';
import axios from 'axios';

import { useSnackbarStore } from "@/stores/snackbarStore";
import AnimationChat from "@/components/animations/AnimationChat1.vue";
import AnimationAi from "@/components/animations/AnimationBot1.vue";
import { countAndCompleteCodeBlocks } from "@/utils/aiUtils"; // 移除了 read (不再需要流式读取)
import { scrollToBottom } from "@/utils/common";
import { MdPreview } from "md-editor-v3";
import { useChatGPTStore } from "@/stores/chatGPTStore";
import "md-editor-v3/lib/preview.css";
import ApiKeyDialog from "@/components/ApiKeyDialog.vue";

const profileStore = useProfileStore();
const signon = reactive({ ...profileStore.signon });
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

interface Message {
  content: string;
  role: "user" | "assistant" | "system";
}

// User Input Message
const userMessage = ref("");

// Message List
const messages = ref<Message[]>([]);

const isLoading = ref(false);

// Send Messsage
const sendMessage = async () => {
  if (userMessage.value.trim()) {
    const currentMessage = userMessage.value;
    
    // 1. 将用户消息推入界面展示
    messages.value.push({
      content: currentMessage,
      role: "user",
    });

    // 2. 清空输入框
    userMessage.value = "";

    // 3. 调用后端 Agent 接口
    await createCompletion(currentMessage);
  }
};

const createCompletion = async (currentMessage: string) => {
  isLoading.value = true;
  
  try {
    // 构造历史记录（排除刚才推入的最新一条用户消息，因为它作为 message 参数单发）
    // 为了防止报文过大，这里限制最多携带历史前 10 条
    const history = messages.value
      .slice(-11, -1) 
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // 请求后端我们自己写的 Agent 接口
    const response = await axios.post('http://localhost:5000/chat-ai/chat', {
      message: currentMessage,
      history: history
    });

    if (response.data.code === 200) {
      // 获取到 AI 回复，推入消息列表
      messages.value.push({
        content: response.data.data.reply,
        role: "assistant",
      });
    } else {
      snackbarStore.showErrorMessage(response.data.message || "请求失败");
    }
  } catch (error: any) {
    console.error("AI 接口调用失败:", error);
    snackbarStore.showErrorMessage("网络异常或服务器出错，请稍后再试");
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => messages.value,
  (val) => {
    if (val) {
      scrollToBottom(document.querySelector(".message-container"));
      // 找到最后一条消息
      const last = val[val.length - 1];
      // 如果是 AI 回复，联动 Live2D
      if (last?.role === "assistant" && last.content) {
        try {
          const firstSentence = last.content.split(/(?<=[。！？\n.?!])\s*/)[0] || last.content.slice(0, 50);
          live2d.setMessageBox(firstSentence, 4000);
        } catch (error) {
          console.warn('Live2D message display failed:', error);
        }
      }
    }
  },
  {
    deep: true,
  }
);

const displayMessages = computed(() => {
  if (messages.value.length === 0) return [];
  const messagesCopy = messages.value.slice(); 
  const lastMessage = messagesCopy[messagesCopy.length - 1];
  const updatedLastMessage = {
    ...lastMessage,
    content: countAndCompleteCodeBlocks(lastMessage.content),
  };
  messagesCopy[messagesCopy.length - 1] = updatedLastMessage;
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
  try {
    setTimeout(() => {
      live2d.setMessageBox("欢迎欢迎~我是您的专属房产助理，想看什么房子呢？", 4000);
    }, 1000);
  } catch (error) {
    console.warn('Live2D initialization failed:', error);
  }
});
</script>

<template>
  <div class="chat-bot">
    <div class="messsage-area">
      <perfect-scrollbar v-if="messages.length > 0" class="message-container">
        <template v-for="(message, index) in displayMessages" :key="index">
          <div v-if="message.role === 'user'">
            <div class="pa-4 user-message">
              <v-avatar class="ml-4" rounded="sm" variant="elevated">
                <img :src="signon.avatarUrl" alt="user" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-text>
                  <b> {{ message.content }}</b>
                </v-card-text>
              </v-card>
            </div>
          </div>
          <div v-else>
            <div class="pa-2 pa-md-5 assistant-message">
              <v-avatar
                class="d-none d-md-block mr-2 mr-md-4"
                rounded="sm"
                variant="elevated"
              >
                <img
                  src="@/assets/images/avatars/avatar_assistant.jpg"
                  alt="bot"
                />
              </v-avatar>
              <v-card>
                <div>
                  <md-preview :modelValue="message.content" class="font-1" />
                </div>
              </v-card>
            </div>
          </div>
        </template>
        <div v-if="isLoading">
          <div class="pa-6">
            <div class="message">
              <AnimationAi :size="100" />
            </div>
          </div>
        </div>
      </perfect-scrollbar>
      <div class="no-message-container" v-else>
        <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">
          智能房产推荐
        </h1>
        <AnimationChat :size="300" />
      </div>
    </div>
    <div class="input-area">
      <v-sheet
        color="transparent"
        elevation="0"
        class="input-panel d-flex align-end pa-1"
      >
        <v-btn
          class="mb-1"
          variant="elevated"
          icon
          @click="chatGPTStore.configDialog = true"
        >
          <v-icon size="30" class="text-primary">mdi-cog-outline</v-icon>
          <v-tooltip
            activator="parent"
            location="top"
            text="系统设置"
          ></v-tooltip>
        </v-btn>
        <transition name="fade">
          <v-textarea
            class="mx-2"
            color="primary"
            type="text"
            clearable
            variant="solo"
            ref="input"
            v-model="userMessage"
            placeholder="例如：帮我找一套雨花区1500以内的房子"
            hide-details
            @keydown="handleKeydown"
            :rows="inputRow"
            @focus="inputRow = 3"
            @blur="inputRow = 1"
            :disabled="isLoading"
          >
          </v-textarea>
        </transition>

        <v-btn class="mb-1" color="primary" variant="elevated" icon :disabled="isLoading">
          <v-icon @click="sendMessage">mdi-send</v-icon>
        </v-btn>
      </v-sheet>
      <ApiKeyDialog />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 这里的样式不需要变动，保留你原有的 CSS 即可 */
.chat-bot {
  background-repeat: repeat;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

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

@media screen and (max-width: 768px) {
  :deep(#md-editor-v3-preview),
  .user-message {
    font-size: 14px !important;
  }
}
</style>
