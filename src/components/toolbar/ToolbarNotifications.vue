<script setup lang="ts">
import { onMounted, ref } from "vue";
import apiClient from "@/api/client";

interface Message {
  message_id: number;
  content: string;
  sender_username: string;
  receiver_username: string;
  timestamp: string;
  channel_id: number;
}

interface DisplayMessage {
  title: string;
  subtitle: string;
  time: string;
  originalMessage: Message;
}

const menuOpen = ref(false);
const messages = ref<DisplayMessage[]>([]);
const loading = ref(false);
const error = ref(false);

const formatTime = (timestamp: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000),
  );
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
};

const fetchMessages = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await apiClient.get("/messages/received");
    const data = response.data;
    const received = Array.isArray(data) ? data : [];
    messages.value = received.map((message: Message) => ({
      title: `来自 ${message.sender_username} 的消息`,
      subtitle: message.content,
      time: formatTime(message.timestamp),
      originalMessage: message,
    }));
  } catch (requestError) {
    error.value = true;
    console.error("Failed to load notifications", requestError);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchMessages);
</script>

<template>
  <v-menu v-model="menuOpen" location="bottom right" transition="slide-y-transition">
    <template #activator="{ props }">
      <v-btn icon v-bind="props" class="text-none" aria-label="通知">
        <v-badge v-if="messages.length" :content="messages.length" color="error">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell-outline</v-icon>
      </v-btn>
    </template>

    <v-list elevation="1" lines="three" density="compact" width="400">
      <v-list-subheader class="font-weight-bold">消息列表</v-list-subheader>
      <v-list-item v-if="loading">
        <v-progress-circular indeterminate color="primary" />
      </v-list-item>
      <v-list-item v-else-if="error">
        <v-alert type="error" variant="tonal">加载消息失败</v-alert>
      </v-list-item>
      <v-list-item v-else-if="messages.length === 0" title="暂无消息" />
      <v-list-item
        v-for="message in messages"
        v-else
        :key="message.originalMessage.message_id"
      >
        <template #prepend>
          <v-avatar size="40" color="primary">
            <v-icon color="white">mdi-account-circle</v-icon>
          </v-avatar>
        </template>
        <template #append>
          <span class="text-body-2 text-grey">{{ message.time }}</span>
        </template>
        <v-list-item-title class="font-weight-bold text-primary">
          {{ message.title }}
        </v-list-item-title>
        <v-list-item-subtitle>{{ message.subtitle }}</v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-btn block variant="text" @click="menuOpen = false">关闭</v-btn>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
