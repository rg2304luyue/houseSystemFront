<template>
  <div class="chat-room">
    <div class="chat-container">
      <div class="messsage-area">
        <perfect-scrollbar v-if="messages.length > 0" class="message-container">
          <template v-for="message in messages" :key="message.message_id">
            <div class="pa-4" :class="{
              'user-message': message.sender_username === currentUser,
              'other-message': message.sender_username !== currentUser
            }">
              <v-avatar class="ml-4 mr-3" rounded="sm" variant="elevated">
                <img :src="message.sender_username === currentUser
                  ? currentUserAvatar
                  : landlordAvatar"
                  :alt="message.sender_username" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-title class="text-caption">
                  {{ message.sender_username }}
                  <span class="text-caption text-grey ml-2">
                    {{ new Date(message.timestamp).toISOString().substr(11, 8) }}
                  </span>
                  <span v-if="message._failed" class="text-red ml-2">发送失败</span>
                </v-card-title>
                <v-card-text>
                  {{ message.content }}
                </v-card-text>
              </v-card>
            </div>
          </template>
          <div v-if="isLoading" class="loading-indicator">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
        </perfect-scrollbar>
        <div class="no-message-container" v-else>
          <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">
            {{ currentUser }}与{{ landlord }}的聊天室
          </h1>
          <p class="text-grey">开始与{{ landlord }}交流吧</p>
        </div>
      </div>
    </div>
    <div class="input-area">
      <v-sheet
        color="transparent"
        elevation="0"
        class="input-panel d-flex align-end pa-1"
      >
        <v-textarea
          class="mx-2"
          color="primary"
          type="text"
          clearable
          variant="solo"
          ref="input"
          v-model="userMessage"
          placeholder="输入消息..."
          hide-details
          @keydown="handleKeydown"
          :rows="inputRow"
          @focus="inputRow = 3"
          @blur="inputRow = 1"
          :disabled="!isConnected"
        >
        </v-textarea>
        <v-btn
          class="mb-1"
          color="primary"
          variant="elevated"
          icon
          @click="sendMessage"
          :disabled="!isConnected"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-sheet>
      <div class="connection-status">
        <v-chip :color="isConnected ? 'green' : 'red'" small>
          {{ isConnected ? '已连接' : '已断开' }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/stores/profileStore";
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { scrollToBottom } from "@/utils/common";
import { useSnackbarStore } from "@/stores/snackbarStore";
import io, { type Socket } from 'socket.io-client';
import apiClient from '@/api/client';

const route = useRoute();
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();

const token = localStorage.getItem('token') || '';

const landlord = ref(route.query.landlord as string || '房东');
const currentUser = ref(profileStore.user.name);

const currentUserAvatar = ref('');
const landlordAvatar = ref('');

interface Message {
  message_id: string;
  content: string;
  sender_username: string;
  receiver_username: string;
  timestamp: number;
  _failed?: boolean;
}

const userMessage = ref("");
const messages = ref<Message[]>([]);
const inputRow = ref(1);
const isLoading = ref(false);
const isConnected = ref(false);

const DEFAULT_AVATAR = '/user/images/13_20250612120622.jpg';

// 已接收消息 ID 集合，用于去重
const receivedIds = new Set<string>();

// 标记是否已完成首次加载，防止 onMounted 和 connect 双重 fetch 导致页面抖动
let hasInitialFetch = false;

// ──────────── Socket.IO 连接与认证 ────────────

const socket: Socket = io({
  auth: { token },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

socket.on('connect', () => {
  socket.emit('authenticate', { token }, (ack: any) => {
    if (ack?.status === 'ok') {
      socket.emit('join_chat', { other_username: landlord.value }, (joinAck: any) => {
        if (joinAck?.status === 'ok') {
          isConnected.value = true;
          // 仅在重连时拉取遗漏消息，首次加载由 onMounted 负责
          if (hasInitialFetch) {
            fetchMessagesFromAPI();
          }
        } else {
          snackbarStore.showErrorMessage('加入聊天房间失败');
        }
      });
    } else {
      snackbarStore.showErrorMessage('Socket认证失败: ' + (ack?.message || '未知错误'));
    }
  });
});

socket.on('disconnect', () => {
  isConnected.value = false;
});

socket.on('connect_error', () => {
  isConnected.value = false;
});

// ──────────── 接收消息 ────────────

socket.on('new_message', (newMessage: any) => {
  const id = String(newMessage.message_id);
  if (receivedIds.has(id)) return;
  receivedIds.add(id);

  const isRelevant =
    (newMessage.sender_username === currentUser.value && newMessage.receiver_username === landlord.value) ||
    (newMessage.sender_username === landlord.value && newMessage.receiver_username === currentUser.value);
  if (!isRelevant) return;

  messages.value.push({
    message_id: id,
    content: newMessage.content,
    sender_username: newMessage.sender_username,
    receiver_username: newMessage.receiver_username,
    timestamp: new Date(newMessage.timestamp).getTime()
  });
  nextTick(() => {
    scrollToBottom(document.querySelector(".message-container"));
  });
});

// ──────────── REST API ────────────

const fetchMessagesFromAPI = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(
      `/comments/messages?user1=${currentUser.value}&user2=${landlord.value}`
    );
    if (response.data.code === 200) {
      const serverMessages = response.data.data.messages.map((msg: any) => {
        receivedIds.add(String(msg.message_id));
        return {
          ...msg,
          timestamp: new Date(msg.timestamp).getTime()
        };
      });
      messages.value = serverMessages;
    }
  } catch (error) {
    console.error('获取消息错误:', error);
    snackbarStore.showErrorMessage('获取历史消息失败');
  } finally {
    isLoading.value = false;
  }
};

const fetchUserAvatar = async (username: string): Promise<string> => {
  try {
    const userResponse = await apiClient.get(`/user/userinfo/${username}`);
    if (userResponse.data.code === 200) {
      const userId = userResponse.data.data.id;
      const avatarResponse = await apiClient.get('/user/userinfo/avatar', {
        params: { id: userId }
      });
      if (avatarResponse.data.code === 200 && avatarResponse.data.data.avatarUrl) {
        return avatarResponse.data.data.avatarUrl;
      }
    }
    return DEFAULT_AVATAR;
  } catch (error) {
    console.error('获取用户头像失败:', error);
    return DEFAULT_AVATAR;
  }
};

const loadAvatars = async () => {
  currentUserAvatar.value = await fetchUserAvatar(currentUser.value);
  landlordAvatar.value = await fetchUserAvatar(landlord.value);
};

// ──────────── 发送消息 ────────────

const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  if (!isConnected.value) {
    snackbarStore.showErrorMessage('连接已断开，请刷新页面重试');
    return;
  }

  const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const content = userMessage.value;

  // 乐观更新：立即显示
  const optimistic: Message = {
    message_id: tempId,
    content,
    sender_username: currentUser.value,
    receiver_username: landlord.value,
    timestamp: Date.now()
  };
  messages.value.push(optimistic);
  userMessage.value = "";
  nextTick(() => {
    scrollToBottom(document.querySelector(".message-container"));
  });

  // 发送到服务器，等待确认
  socket.emit('send_message', {
    receiver_username: landlord.value,
    content
  }, (ack: any) => {
    if (ack?.status === 'ok') {
      // 替换临时 ID 为服务器 ID
      const idx = messages.value.findIndex(m => m.message_id === tempId);
      if (idx !== -1) {
        messages.value[idx].message_id = String(ack.message_id);
        messages.value[idx].timestamp = new Date(ack.timestamp).getTime();
        receivedIds.add(String(ack.message_id));
      }
    } else {
      // 标记发送失败
      const idx = messages.value.findIndex(m => m.message_id === tempId);
      if (idx !== -1) {
        messages.value[idx]._failed = true;
      }
      snackbarStore.showErrorMessage('消息发送失败: ' + (ack?.message || '未知错误'));
    }
  });
};

// ──────────── 键盘事件 ────────────

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
    e.preventDefault();
    userMessage.value += "\n";
  } else if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

// ──────────── 生命周期 ────────────

onMounted(async () => {
  await loadAvatars();
  await fetchMessagesFromAPI();
  hasInitialFetch = true;
});

onUnmounted(() => {
  socket.emit('leave_chat', { other_username: landlord.value });
  socket.off('new_message');
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
});
</script>

<style scoped lang="scss">
/* 原有样式保持不变 */
.chat-room {
  background-repeat: repeat;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .chat-container {
    display: flex;
    height: 100%;
  }

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

    .connection-status {
      text-align: center;
      margin-top: 8px;
    }
  }
}

.user-message {
  display: flex;
  align-content: center;
  justify-content: flex-end;

  .v-avatar {
    order: 2;
    margin-left: 16px;
  }

  .v-card {
    order: 1;
    background: linear-gradient(45deg, #2196F3, #00BCD4);
  }
}

.other-message {
  display: flex;
    align-content: center;
    justify-content: flex-start;

    .v-card {
      background: linear-gradient(45deg, #4CAF50, #8BC34A);
    }
}

.message-container {
  height: calc(100vh - 154px);
  padding-bottom: 80px;
  position: relative;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 16px;
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
    margin-bottom: 16px;
  }
}

@media screen and (max-width: 768px) {
  .message-container {
    height: calc(100vh - 200px);
  }

  .user-message, .other-message {
    font-size: 14px !important;
    padding: 8px !important;

    .v-avatar {
      width: 32px !important;
      height: 32px !important;
      margin-left: 8px !important;
    }
  }
}
</style>
