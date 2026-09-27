<script setup lang="ts">
import * as live2d from "live2d-render";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import AnimationChat from "@/components/animations/AnimationChat1.vue";
import SafeMarkdown from "@/components/chat/SafeMarkdown.vue";
import { useChatRun, type ChatViewMessage } from "@/composables/useChatRun";
import { countAndCompleteCodeBlocks } from "@/utils/aiUtils";
import { scrollToBottom } from "@/utils/common";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

const authStore = useAuthStore();
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();
const signon = reactive({ ...profileStore.signon });

const isValidToken = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 10 &&
  value !== "undefined" &&
  value !== "null";

const getToken = (): string | null => {
  if (isValidToken(authStore.token)) return authStore.token;
  for (const key of ["token", "accessToken", "userToken"]) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const candidate =
        (typeof parsed === "string" ? parsed : null) ??
        parsed?.token ??
        parsed?.accessToken ??
        parsed?.value;
      if (isValidToken(candidate)) return candidate;
    } catch {
      if (isValidToken(raw)) return raw;
    }
  }
  return null;
};

const {
  messages,
  sessionList,
  currentSessionId,
  isSessionLoading,
  isGenerating,
  initialize,
  loadSession: loadChatSession,
  createNewChat: resetChat,
  deleteSession,
  sendMessage: submitMessage,
  stopGeneration,
  dispose,
} = useChatRun({
  getToken,
  getOwnerId: () => {
    const id = profileStore.user?.id;
    return id === null || id === undefined ? null : String(id);
  },
  notifyError: (message) => snackbarStore.showErrorMessage(message),
  notifySuccess: (message) => snackbarStore.showSuccessMessage(message),
});

const route = useRoute();
const contextHouseId = Number(route.query.houseId);
const userMessage = ref(Number.isSafeInteger(contextHouseId) && contextHouseId > 0
  ? `请介绍房源 ID ${contextHouseId}，并告诉我预约前需要确认哪些信息。`
  : "");
const { mdAndUp } = useDisplay();
// 移动端默认收起历史抽屉，避免首次进入即遮挡对话
const drawer = ref(mdAndUp.value);
const inputRow = ref(1);
const isBusy = computed(() => isGenerating.value || isSessionLoading.value);

const displayMessages = computed(() =>
  messages.value.map((message: ChatViewMessage) => ({
    ...message,
    content: message.streaming
      ? countAndCompleteCodeBlocks(message.content)
      : message.content,
  })),
);

const sendMessage = () => {
  const content = userMessage.value.trim();
  if (!content || isBusy.value) return;
  userMessage.value = "";
  void submitMessage(content);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return;
  if (event.key === "Enter" && (event.altKey || event.shiftKey)) {
    event.preventDefault();
    userMessage.value += "\n";
  } else if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
};

const loadSession = (sessionId: number) => {
  void loadChatSession(sessionId);
};

const createNewChat = () => {
  void resetChat();
};

const deleteDialog = ref(false);
const sessionToDelete = ref<(typeof sessionList.value)[number] | null>(null);

const confirmDeleteSession = (session: (typeof sessionList.value)[number]) => {
  sessionToDelete.value = session;
  deleteDialog.value = true;
};

const executeDelete = async () => {
  const session = sessionToDelete.value;
  if (!session) return;
  try {
    await deleteSession(session.id);
  } catch (error) {
    snackbarStore.showErrorMessage("删除失败，请稍后重试");
  } finally {
    deleteDialog.value = false;
    sessionToDelete.value = null;
  }
};

watch(
  messages,
  (value) => {
    nextTick(() => scrollToBottom(document.querySelector(".message-container")));
    const last = value[value.length - 1];
    if (last?.role === "assistant" && last.content && !last.streaming) {
      try {
        const firstSentence = last.content.split(/(?<=[。！？\n.?!])\s*/)[0];
        setTimeout(() => {
          live2d.setMessageBox(firstSentence || last.content.slice(0, 50), 4000);
        }, 100);
      } catch {
        // The assistant remains usable when the optional Live2D widget is absent.
      }
    }
  },
  { deep: true },
);

let tokenPollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  const start = () => void initialize();
  if (getToken()) {
    start();
  } else {
    let attempts = 0;
    tokenPollTimer = setInterval(() => {
      attempts += 1;
      if (getToken()) {
        clearInterval(tokenPollTimer!);
        tokenPollTimer = null;
        start();
      } else if (attempts >= 10) {
        clearInterval(tokenPollTimer!);
        tokenPollTimer = null;
      }
    }, 500);
  }
  try {
    setTimeout(() => {
      live2d.setMessageBox("欢迎！左侧可以选择您的历史对话哦~", 4000);
    }, 1500);
  } catch {
    // Optional decoration only.
  }
});

onUnmounted(() => {
  if (tokenPollTimer) clearInterval(tokenPollTimer);
  dispose();
});
</script>

<template>
  <div class="chat-bot-wrapper d-flex h-100">
    <v-navigation-drawer
      v-model="drawer"
      mobile-breakpoint="md"
      width="260"
      color="surface"
      class="chat-drawer"
    >
      <div class="pa-4">
        <v-btn color="primary" variant="flat" block prepend-icon="mdi-plus" @click="createNewChat">
          新建对话
        </v-btn>
      </div>

      <v-divider />

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
          <template #prepend>
            <v-icon size="18">mdi-message-outline</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ session.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ session.updated_at?.split(" ")[0] }}
          </v-list-item-subtitle>
          <template #append>
            <v-btn
              icon
              variant="text"
              size="small"
              class="text-medium-emphasis"
              title="删除此对话"
              @click.stop="confirmDeleteSession(session)"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6 font-weight-bold pt-5 px-6">确认删除</v-card-title>
          <v-card-text class="px-6">
            确定要删除对话「<strong>{{ sessionToDelete?.title }}</strong>」吗？删除后不可恢复。
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
            <v-btn color="error" variant="flat" @click="executeDelete">
              <v-icon start>mdi-delete</v-icon>
              删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-navigation-drawer>

    <div class="chat-bot flex-grow-1 position-relative">
      <div class="messsage-area">
        <perfect-scrollbar v-if="messages.length > 0" class="message-container">
          <template v-for="message in displayMessages" :key="message.clientId">
            <div v-if="message.role === 'user'" class="pa-4 user-message">
              <v-avatar class="ml-3" size="36" color="primary" variant="tonal">
                <img v-if="signon.avatarUrl" :src="signon.avatarUrl" alt="user" class="avatar-img" />
                <v-icon v-else size="20">mdi-account</v-icon>
              </v-avatar>
              <v-card class="user-bubble text-pre-wrap" color="primary" variant="flat">
                <v-card-text>{{ message.content }}</v-card-text>
              </v-card>
            </div>

            <div v-else class="pa-2 pa-md-5 assistant-message">
              <v-avatar class="d-none d-md-flex mr-2 mr-md-3" size="36">
                <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="bot" />
              </v-avatar>
              <div class="assistant-content-wrapper">
                <v-card class="assistant-bubble">
                  <div v-if="message.streaming" class="streaming-wrapper">
                    <div v-if="message.activity && !message.content" class="agent-activity">
                      <v-progress-circular indeterminate size="18" width="2" color="primary" />
                      <span>{{ message.activity }}</span>
                    </div>
                    <SafeMarkdown :content="message.content" class="font-1" />
                    <span v-if="message.content" class="streaming-cursor">▋</span>
                  </div>
                  <SafeMarkdown v-else :content="message.content" class="font-1" />
                  <v-alert
                    v-if="message.notice"
                    type="warning"
                    variant="tonal"
                    density="compact"
                    class="ma-3 mt-0"
                  >
                    {{ message.notice }}
                  </v-alert>
                </v-card>
              </div>
            </div>
          </template>
        </perfect-scrollbar>

        <div v-else class="no-message-container">
          <h1 class="text-primary">智能找房助手</h1>
          <p class="house-muted mt-2 px-4 text-center">说出预算、区域和户型，我来帮您筛选合适的房源</p>
          <AnimationChat :size="260" />
        </div>
      </div>

      <div class="input-area">
        <v-sheet color="transparent" elevation="0" class="input-panel d-flex align-end pa-1">
          <v-btn class="mb-1 mr-1 d-md-none" variant="text" icon @click="drawer = !drawer">
            <v-icon>mdi-menu</v-icon>
          </v-btn>

          <v-textarea
            v-model="userMessage"
            class="mx-2 chat-input"
            color="primary"
            clearable
            variant="solo"
            flat
            bg-color="transparent"
            placeholder="找房需求，直接告诉我..."
            hide-details
            maxlength="4000"
            :rows="inputRow"
            :disabled="isBusy"
            @keydown="handleKeydown"
            @focus="inputRow = 3"
            @blur="inputRow = 1"
          />

          <v-btn
            v-if="!isGenerating"
            class="mb-1"
            color="primary"
            variant="flat"
            icon
            :disabled="isSessionLoading"
            @click="sendMessage"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
          <v-btn
            v-else
            class="mb-1"
            color="error"
            variant="flat"
            icon
            title="停止生成"
            @click="stopGeneration"
          >
            <v-icon>mdi-stop</v-icon>
          </v-btn>
        </v-sheet>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-bot-wrapper {
  overflow: hidden;
}

.chat-bot {
  background: var(--house-paper);
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
      background: rgb(var(--v-theme-surface));
      box-shadow: var(--house-shadow);
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
    font-size: 1.75rem;
    font-weight: 700;
  }
}

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

.streaming-cursor {
  display: inline-block;
  color: rgb(var(--v-theme-primary));
  font-weight: bold;
  animation: blink 0.8s step-end infinite;
  margin-left: 2px;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

:deep(.md-editor-preview-wrapper) {
  padding: 5px 15px;
}

.assistant-bubble :deep(.md-editor) {
  --md-bk-color: transparent;
  --md-color: var(--house-ink);
  background-color: transparent;
  color: var(--house-ink);
}

.assistant-bubble :deep(.md-editor-preview) {
  color: var(--house-ink);
}

.font-1 {
  font-size: 13px !important;
}

:deep(.chat-drawer) {
  border-right: 1px solid var(--house-line) !important;

  .v-list-subheader {
    color: var(--house-muted) !important;
    font-weight: 600;
  }

  .v-list-item {
    color: var(--house-ink);
  }

  .v-list-item-subtitle {
    color: var(--house-muted);
    opacity: 1;
  }

  .v-list-item--active {
    color: rgb(var(--v-theme-primary));
    background: var(--house-soft);
  }

  .v-list-item--active > .v-list-item__overlay {
    opacity: 0;
  }
}

.user-bubble {
  max-width: min(720px, 80%);
  border-radius: 16px 4px 16px 16px !important;
  border: none !important;
}

.assistant-bubble {
  padding: 6px 12px;
  border-radius: 4px 16px 16px 16px !important;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
