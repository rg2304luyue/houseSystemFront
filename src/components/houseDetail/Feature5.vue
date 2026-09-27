<!--
* @Component: MessageBoard
* @Maintainer: Your Name
* @Description: 留言板页面，用户可提交留言
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";
import SafeMarkdown from "@/components/chat/SafeMarkdown.vue";
import apiClient from "@/api/client";

const props = defineProps<{ houseId: number | string }>();
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();

const houseId = computed(() => {
  return String(props.houseId);
});

interface Message {
  id: number;
  content: string;
  username: string;
  timestamp: string;
  at?: number; // 回复的留言ID
  atUsername?: string; // 回复的用户名
}

// 当前用户从profileStore获取
const currentUser = ref(profileStore.user?.name || "");
const messages = ref<Message[]>([]);
const newMessage = ref("");
const isLoading = ref(false);

// 加载留言
const loadMessages = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/houses/${houseId.value}/comments`);

    // 响应拦截器已解包，response.data 直接是留言数组
    const rawMessages = Array.isArray(response.data) ? response.data : [];
    if (rawMessages.length === 0) {
      messages.value = [];
      return;
    }

    messages.value = rawMessages.map((comment: any) => ({
      id: comment.comment_id,
      content: comment.desc,
      username: comment.username,
      timestamp: comment.time,
      at: comment.at || undefined
    }));

    // 为每条留言添加被回复的用户名
    messages.value.forEach(message => {
      if (message.at) {
        const repliedMessage = messages.value.find(m => m.id === message.at);
        if (repliedMessage) {
          message.atUsername = repliedMessage.username;
        }
      }
    });

  } catch (error: any) {
    // 404错误视为无留言，不显示错误提示
    if (error.response?.status !== 404) {
      console.error("加载留言失败:", error);
      snackbarStore.showErrorMessage("加载留言失败，请稍后重试");
    }
    messages.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 提交留言
const submitMessage = async () => {
  if (!newMessage.value.trim()) {
    snackbarStore.showErrorMessage("留言内容不能为空");
    return;
  }

  if (!currentUser.value) {
    snackbarStore.showErrorMessage("请先登录后再留言");
    return;
  }

  try {
    const response = await apiClient.post(`/houses/${houseId.value}/comments`, {
      house_id: parseInt(houseId.value),
      username: currentUser.value,
      type: 1,
      desc: newMessage.value,
      at: null
    });

    if (response.status >= 200 && response.status < 300) {
      // 响应拦截器已解包，response.data 直接是新留言对象
      const newComment = response.data;
      messages.value.unshift({
        id: newComment.comment_id,
        content: newComment.desc,
        username: newComment.username,
        timestamp: newComment.time
      });

      newMessage.value = "";
      snackbarStore.showSuccessMessage("留言已提交，感谢您的反馈！");
    }
  } catch (error) {
    console.error("提交留言失败:", error);
    snackbarStore.showErrorMessage("提交留言失败，请稍后重试");
  }
};

// 格式化时间显示
const formatTime = (timeString: string) => {
  return timeString;
};

// 监听用户信息变化
watch(() => profileStore.user, (newUser) => {
  currentUser.value = newUser?.name || "";
}, { deep: true });

// 监听houseId变化重新加载留言
watch(houseId, () => {
  loadMessages();
});

// 组件挂载时加载留言
onMounted(() => {
  loadMessages();
});
</script>

<template>
  <v-card flat class="message-board">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 px-5 pt-5 pb-3">
      <div>
        <h2 class="house-section-title">留言评论</h2>
        <div class="house-muted text-caption mt-1">欢迎留下您的意见、建议或问题，我们会尽快查看并回复</div>
      </div>
      <v-chip v-if="!isLoading && messages.length > 0" size="small" variant="tonal" label>
        共 {{ messages.length }} 条
      </v-chip>
    </div>

    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
    ></v-progress-linear>

    <v-card-text class="px-5 pt-2 pb-5">
      <!-- 留言列表 -->
      <perfect-scrollbar v-if="!isLoading && messages.length > 0" class="message-list" style="max-height: 500px;">
        <div v-for="(message, index) in messages" :key="index" class="message-item">
          <v-avatar color="primary" variant="tonal" size="36" class="mr-3 flex-shrink-0">
            {{ (message.username || '?').slice(0, 1) }}
          </v-avatar>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-space-between align-center flex-wrap ga-1 mb-1">
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="font-weight-bold">{{ message.username }}</span>
                <v-chip
                  v-if="message.username === currentUser"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  我的留言
                </v-chip>
                <span v-if="message.atUsername" class="text-caption house-muted">
                  回复 @{{ message.atUsername }}
                </span>
              </div>
              <span class="text-caption house-muted">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              <SafeMarkdown :content="message.content" />
            </div>
          </div>
        </div>
      </perfect-scrollbar>

      <!-- 无留言提示 -->
      <div v-if="!isLoading && messages.length === 0" class="house-empty py-8">
        <v-icon>mdi-comment-outline</v-icon>
        <span>暂无留言，快来发表第一条留言吧！</span>
      </div>

      <!-- 留言表单 -->
      <div class="message-form mt-4">
        <v-alert
          v-if="!currentUser"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          请先登录后再留言
        </v-alert>
        <div v-else class="house-muted text-caption mb-2">以 {{ currentUser }} 的身份发表留言</div>

        <v-form @submit.prevent="submitMessage">
          <v-textarea
            v-model="newMessage"
            label="留言内容"
            variant="outlined"
            rows="4"
            auto-grow
            required
            :disabled="!currentUser"
            hide-details="auto"
            class="mb-3"
          ></v-textarea>

          <div class="d-flex justify-end">
            <v-btn
              color="primary"
              variant="flat"
              type="submit"
              prepend-icon="mdi-send"
              :disabled="!currentUser"
            >
              提交留言
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.message-board {
  .message-list {
    padding-right: 8px;
  }
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid var(--house-line);

  &:first-child { padding-top: 4px; }
}

.message-content {
  color: var(--house-ink);
  font-size: .9rem;
  line-height: 1.6;
}

.message-form {
  padding-top: 16px;
  border-top: 1px solid var(--house-line);
}

.min-w-0 { min-width: 0; }

:deep(.md-editor) {
  --md-bk-color: transparent;
  --md-color: var(--house-ink);
  background-color: transparent !important;
  color: var(--house-ink);
}

:deep(.md-editor-preview-wrapper) {
  padding: 0;
  background-color: transparent !important;
}

:deep(.md-editor-preview) {
  color: var(--house-ink);
  font-size: .9rem;
}

:deep(.md-editor-preview p:last-child) { margin-bottom: 0; }
</style>
