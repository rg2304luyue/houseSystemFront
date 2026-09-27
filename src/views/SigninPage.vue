<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/api/client";
import router from "~/src/router";
import { nextTick, ref, onUnmounted } from 'vue';
import { useRoute } from "vue-router";
import { safeRedirectTarget } from "@/utils/authSession";

const authStore = useAuthStore();
const route = useRoute();
const isLoading = ref(false);
const isSignInDisabled = ref(false);
const isEmailCodeLoading = ref(false);
const isSendingEmailCode = ref(false);

// 登录方式切换
const loginMethod = ref("password"); // "password", "email", or "email-code"

// 表单引用
const refPasswordForm = ref();
const refEmailForm = ref();
const refEmailCodeForm = ref();

// 表单数据
const phone = ref("");
const password = ref("");
const email = ref("");
const emailPassword = ref("");
const emailForCode = ref("");
const emailCode = ref("");
const isFormValid = ref(true);

// 邮箱验证码相关
const emailCountdown = ref(0);
const emailCountdownTimer = ref<NodeJS.Timeout | null>(null);

// 显示密码
const showPassword = ref(false);

// 错误处理
const error = ref(false);
const errorMessages = ref("");
const finishNavigation = () => router.replace(safeRedirectTarget(route.query.redirect));

// 密码登录
const handlePasswordLogin = async () => {
  const { valid } = await refPasswordForm.value.validate();

  if (valid) {
    isLoading.value = true;
    isSignInDisabled.value = true;
    error.value = false;
    errorMessages.value = "";

    try {
      await authStore.loginWithUsernameAndPassword(phone.value, password.value);
      await finishNavigation();
    } catch (err) {
      console.error("登录出错", err);
      error.value = true;
      errorMessages.value = "用户名或密码错误";
      await nextTick();
      refPasswordForm.value.$el.classList.add('shake');
      setTimeout(() => {
        refPasswordForm.value.$el.classList.remove('shake');
      }, 500);
      return;
    } finally {
      isLoading.value = false;
      isSignInDisabled.value = false;
    }
  }
};

// 验证手机号格式
const validatePhone = (phone) => {
  const pattern = /^1[3-9]\d{9}$/;
  return pattern.test(phone);
};

// 表单验证规则
const phoneRules = ref([
  (v: string) => !!v || "手机号不能为空",
  (v: string) => validatePhone(v) || "请输入正确的手机号格式",
]);

const passwordRules = ref([
  (v: string) => !!v || "密码不能为空",
  (v: string) => (v && v.length <= 20) || "密码长度不能超过20个字符",
]);

// 邮箱验证规则
const emailRules = ref([
  (v: string) => !!v || "邮箱不能为空",
  (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(v) || "请输入正确的邮箱格式";
  },
]);

const emailPasswordRules = ref([
  (v: string) => !!v || "密码不能为空",
  (v: string) => (v && v.length <= 20) || "密码长度不能超过20个字符",
]);

const emailCodeRules = ref([
  (v: string) => !!v || "验证码不能为空",
  (v: string) => (v && v.length === 6) || "验证码必须是6位数字",
]);

// 邮箱登录
const handleEmailLogin = async () => {
  const { valid } = await refEmailForm.value.validate();

  if (valid) {
    isLoading.value = true;
    isSignInDisabled.value = true;
    error.value = false;
    errorMessages.value = "";

    try {
      await authStore.loginWithEmailAndPassword(email.value, emailPassword.value);
      await finishNavigation();
    } catch (err) {
      console.error("邮箱登录出错", err);
      error.value = true;
      errorMessages.value = "邮箱或密码错误";
      await nextTick();
      refEmailForm.value.$el.classList.add('shake');
      setTimeout(() => {
        refEmailForm.value.$el.classList.remove('shake');
      }, 500);
      return;
    } finally {
      isLoading.value = false;
      isSignInDisabled.value = false;
    }
  }
};

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (!emailForCode.value) {
    error.value = true;
    errorMessages.value = "请输入邮箱地址";
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailForCode.value)) {
    error.value = true;
    errorMessages.value = "请输入正确的邮箱格式";
    return;
  }

  if (emailCountdown.value > 0) {
    return; // 防止重复发送
  }

  isSendingEmailCode.value = true;
  error.value = false;
  errorMessages.value = "";

  try {
    await apiClient.post('/auth/email-code', {
      email: emailForCode.value
    });
    // 请求成功（interceptor 已校验 code 2xx），开始倒计时
    startEmailCountdown();
    errorMessages.value = "验证码已发送，请查收邮件";
    error.value = false;
  } catch (err: any) {
    console.error("发送邮箱验证码出错", err);
    error.value = true;
    errorMessages.value = err?.response?.data?.detail || err?.response?.data?.message || err.message || "网络错误，发送失败";
  } finally {
    isSendingEmailCode.value = false;
  }
};

// 邮箱验证码登录
const handleEmailCodeLogin = async () => {
  const { valid } = await refEmailCodeForm.value.validate();

  if (valid) {
    isEmailCodeLoading.value = true;
    error.value = false;
    errorMessages.value = "";

    try {
      const response = await apiClient.post('/auth/email-code/login', {
          email: emailForCode.value,
          code: emailCode.value
      });

      // interceptor 已校验 success，response.data 已是解包后的内层 data
      await authStore.completeLogin(response.data);
      await finishNavigation();
    } catch (err: any) {
      console.error("邮箱验证码登录出错", err);
      error.value = true;
      errorMessages.value = err?.response?.data?.detail || err?.response?.data?.message || err.message || "网络错误，登录失败";
    } finally {
      isEmailCodeLoading.value = false;
    }
  }
};

// 开始邮箱验证码倒计时
const startEmailCountdown = () => {
  emailCountdown.value = 60;
  emailCountdownTimer.value = setInterval(() => {
    emailCountdown.value--;
    if (emailCountdown.value <= 0) {
      if (emailCountdownTimer.value) {
        clearInterval(emailCountdownTimer.value);
        emailCountdownTimer.value = null;
      }
    }
  }, 1000);
};

// 重置错误
const resetErrors = () => {
  error.value = false;
  errorMessages.value = "";
};

// 重置密码
const resetPassword = () => {
  router.push(`/setpassword`);
};

// 导入需要的stores已在文件开头

// 组件销毁时清理定时器
onUnmounted(() => {
  if (emailCountdownTimer.value) {
    clearInterval(emailCountdownTimer.value);
  }
});
</script>

<template>
  <div class="auth-form">
    <header class="mb-6">
      <h1 class="auth-title">欢迎登录</h1>
      <p class="house-muted mt-1">选择一种方式登录好客租房</p>
    </header>

    <!-- 错误提示 -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="error = false"
    >
      {{ errorMessages }}
    </v-alert>

    <!-- 成功提示 -->
    <v-alert
      v-if="!error && errorMessages"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="errorMessages = ''"
    >
      {{ errorMessages }}
    </v-alert>

    <!-- 登录方式选择（分段选择器，窄屏下三项均完整可见） -->
    <v-btn-toggle
      v-model="loginMethod"
      mandatory
      class="login-switch mb-6"
      variant="text"
    >
      <v-btn value="password">
        <v-icon start class="d-none d-sm-inline-flex">mdi-lock-outline</v-icon>
        密码登录
      </v-btn>
      <v-btn value="email">
        <v-icon start class="d-none d-sm-inline-flex">mdi-email-outline</v-icon>
        邮箱登录
      </v-btn>
      <v-btn value="email-code">
        <v-icon start class="d-none d-sm-inline-flex">mdi-email-check-outline</v-icon>
        邮箱验证码
      </v-btn>
    </v-btn-toggle>

    <v-window v-model="loginMethod">
      <!-- 密码登录表单 -->
      <v-window-item value="password">
        <v-form
          ref="refPasswordForm"
          class="text-left"
          v-model="isFormValid"
          lazy-validation
        >
          <v-text-field
            v-model="phone"
            required
            :error="error"
            label="手机号"
            placeholder="请输入手机号"
            color="primary"
            :rules="phoneRules"
            name="phone"
            prepend-inner-icon="mdi-cellphone"
            class="mb-2"
            @keyup.enter="handlePasswordLogin"
            @change="resetErrors"
          ></v-text-field>

          <v-text-field
            v-model="password"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            :error="error"
            label="密码"
            placeholder="请输入密码"
            color="primary"
            :rules="passwordRules"
            name="password"
            prepend-inner-icon="mdi-lock-outline"
            @change="resetErrors"
            @keyup.enter="handlePasswordLogin"
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>

          <v-btn
            :loading="isLoading"
            :disabled="isSignInDisabled"
            block
            size="large"
            color="primary"
            variant="flat"
            @click="handlePasswordLogin"
            class="mt-2 font-weight-bold"
          >
            登录
          </v-btn>
        </v-form>
      </v-window-item>

      <!-- 邮箱登录表单 -->
      <v-window-item value="email">
        <v-form
          ref="refEmailForm"
          class="text-left"
          v-model="isFormValid"
          lazy-validation
        >
          <v-text-field
            v-model="email"
            required
            :error="error"
            label="邮箱"
            placeholder="请输入邮箱地址"
            color="primary"
            :rules="emailRules"
            name="email"
            prepend-inner-icon="mdi-email-outline"
            class="mb-2"
            @keyup.enter="handleEmailLogin"
            @change="resetErrors"
          ></v-text-field>

          <v-text-field
            v-model="emailPassword"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            :error="error"
            label="密码"
            placeholder="请输入密码"
            color="primary"
            :rules="emailPasswordRules"
            name="emailPassword"
            prepend-inner-icon="mdi-lock-outline"
            @change="resetErrors"
            @keyup.enter="handleEmailLogin"
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>

          <v-btn
            :loading="isLoading"
            :disabled="isSignInDisabled"
            block
            size="large"
            color="primary"
            variant="flat"
            @click="handleEmailLogin"
            class="mt-2 font-weight-bold"
          >
            登录
          </v-btn>
        </v-form>
      </v-window-item>

      <!-- 邮箱验证码登录表单 -->
      <v-window-item value="email-code">
        <v-form
          ref="refEmailCodeForm"
          class="text-left"
          v-model="isFormValid"
          lazy-validation
        >
          <v-text-field
            v-model="emailForCode"
            required
            label="邮箱"
            placeholder="请输入邮箱地址"
            color="primary"
            :rules="emailRules"
            name="emailForCode"
            prepend-inner-icon="mdi-email-outline"
            class="mb-2"
            @change="resetErrors"
          ></v-text-field>

          <div class="d-flex align-start ga-2">
            <v-text-field
              v-model="emailCode"
              required
              label="验证码"
              placeholder="请输入6位验证码"
              color="primary"
              :rules="emailCodeRules"
              name="emailCode"
              prepend-inner-icon="mdi-shield-key-outline"
              class="flex-grow-1"
              @keyup.enter="handleEmailCodeLogin"
              @change="resetErrors"
            ></v-text-field>

            <v-btn
              :loading="isSendingEmailCode"
              :disabled="emailCountdown > 0 || !emailForCode"
              color="primary"
              variant="tonal"
              height="56"
              class="code-btn"
              @click="sendEmailCode"
            >
              {{ emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码' }}
            </v-btn>
          </div>

          <v-btn
            :loading="isEmailCodeLoading"
            :disabled="!emailCode || emailCode.length !== 6"
            block
            size="large"
            color="primary"
            variant="flat"
            @click="handleEmailCodeLogin"
            class="mt-2 font-weight-bold"
          >
            登录
          </v-btn>
        </v-form>
      </v-window-item>
    </v-window>

    <div class="d-flex flex-wrap justify-space-between align-center ga-2 mt-6 text-body-2">
      <span class="house-muted">
        还没有账号？
        <router-link to="/auth/signup" class="text-primary font-weight-bold">
          立即注册
        </router-link>
      </span>
      <router-link class="text-primary" to="/setpassword" @click="resetPassword">
        忘记密码？
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--house-ink);
}

.login-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  height: auto !important;
  padding: 4px;
  gap: 4px;
  border-radius: var(--house-radius);
  background: var(--house-soft);
}

.login-switch :deep(.v-btn) {
  min-width: 0;
  height: 40px !important;
  padding: 0 6px;
  border-radius: 8px !important;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--house-muted);
  background: transparent;
}

.login-switch :deep(.v-btn.v-btn--active) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.login-switch :deep(.v-btn.v-btn--active > .v-btn__overlay) {
  opacity: 0 !important;
}

.code-btn {
  flex-shrink: 0;
  min-width: 104px;
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
</style>
