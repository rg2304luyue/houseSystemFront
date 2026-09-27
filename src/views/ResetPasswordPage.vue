<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from "@iconify/vue";
import apiClient from "@/api/client";
import { useSnackbarStore } from "@/stores/snackbarStore";

const snackbarStore = useSnackbarStore();
const router = useRouter();
const isLoading = ref(false);
const resetForm = ref();
const email = ref("");
const verificationCode = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isFormValid = ref(true);
const isCodeSent = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 验证规则
const emailRules = ref([
  (v: string) => !!v || "请输入邮箱地址",
  (v: string) => /.+@.+\..+/.test(v) || "请输入有效的邮箱地址",
]);

const codeRules = ref([
  (v: string) => !!v || "请输入验证码",
  (v: string) => v.length === 6 || "验证码应为6位数字",
]);

const passwordRules = ref([
  (v: string) => !!v || "请输入新密码",
  (v: string) => v.length >= 5 || "密码长度至少为5位",
]);

const confirmPasswordRules = ref([
  (v: string) => !!v || "请确认密码",
  (v: string) => v === newPassword.value || "两次输入的密码不一致",
]);

// 发送验证码（后端不返回验证码，仅发送邮件）
const sendVerificationCode = async () => {
  const { valid } = await resetForm.value.validate();

  if (valid) {
    isLoading.value = true;

    try {
      await apiClient.post("/users/password-reset/send-code", {
        email: email.value
      });

      // 拦截器已校验成功，能执行到这里说明请求已成功
      isCodeSent.value = true;
      startCountdown();
      snackbarStore.showSuccessMessage("验证码已发送至您的邮箱，请查收（有效期2分钟）");
    } catch (error: any) {
      console.error("发送验证码出错", error);
      snackbarStore.showErrorMessage(error?.response?.data?.message || error.message || "发送验证码出错");
    } finally {
      isLoading.value = false;
    }
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = 120;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }, 1000);
};

// 提交重置密码（一次性发送 email + code + password 到后端验证）
const handleResetPassword = async () => {
  if (!isCodeSent.value) {
    await sendVerificationCode();
    return;
  }

  const { valid } = await resetForm.value.validate();

  if (valid) {
    isLoading.value = true;

    try {
      await apiClient.put("/users/password-reset", {
        email: email.value,
        code: verificationCode.value,
        password: newPassword.value
      });

      // 拦截器已校验成功，能执行到这里说明请求已成功
      snackbarStore.showSuccessMessage("密码重置成功，请使用新密码登录");
      router.push("/auth/signin");
    } catch (error: any) {
      console.error("重置密码出错", error);
      snackbarStore.showErrorMessage(error?.response?.data?.message || error.message || "重置密码出错，请稍后重试");
    } finally {
      isLoading.value = false;
    }
  }
};

const backToLogin = () => {
  router.push("/auth/signin");
};
</script>

<template>
  <div class="reset-wrapper">
    <v-card class="reset-card pa-6 pa-sm-8">
      <div class="text-center mb-6">
        <div class="reset-icon mx-auto mb-4">
          <v-icon icon="mdi-lock-reset" size="32" color="primary"></v-icon>
        </div>
        <h1 class="reset-title">重置密码</h1>
        <p class="house-muted mt-2 text-body-2">
          请输入您的注册邮箱，我们将发送密码重置验证码
        </p>
      </div>

      <v-form
        ref="resetForm"
        class="text-left"
        v-model="isFormValid"
        lazy-validation
      >
        <v-text-field
          v-model="email"
          :rules="emailRules"
          label="电子邮箱"
          placeholder="example@domain.com"
          prepend-inner-icon="mdi-email-outline"
          color="primary"
          name="email"
          validateOn="blur"
          @keyup.enter="handleResetPassword"
          class="mb-2"
          :disabled="isCodeSent"
        ></v-text-field>

        <v-text-field
          v-if="isCodeSent"
          v-model="verificationCode"
          :rules="codeRules"
          label="验证码"
          placeholder="请输入6位验证码"
          prepend-inner-icon="mdi-message-text-outline"
          color="primary"
          name="verificationCode"
          validateOn="blur"
          @keyup.enter="handleResetPassword"
          class="mb-2"
        ></v-text-field>

        <v-text-field
          v-if="isCodeSent"
          v-model="newPassword"
          :rules="passwordRules"
          label="新密码"
          placeholder="请输入至少5位的新密码"
          prepend-inner-icon="mdi-lock-outline"
          color="primary"
          name="newPassword"
          type="password"
          validateOn="blur"
          @keyup.enter="handleResetPassword"
          class="mb-2"
        ></v-text-field>

        <v-text-field
          v-if="isCodeSent"
          v-model="confirmPassword"
          :rules="confirmPasswordRules"
          label="确认密码"
          placeholder="请再次输入新密码"
          prepend-inner-icon="mdi-lock-check-outline"
          color="primary"
          name="confirmPassword"
          type="password"
          validateOn="blur"
          @keyup.enter="handleResetPassword"
          class="mb-2"
        ></v-text-field>

        <v-btn
          :loading="isLoading"
          block
          size="large"
          color="primary"
          variant="flat"
          class="font-weight-bold"
          @click="handleResetPassword"
        >
          <template v-if="!isCodeSent">
            获取验证码
          </template>
          <template v-else>
            重置密码
            <span v-if="countdown > 0" class="ml-1">({{ countdown }}s)</span>
          </template>
        </v-btn>

        <div class="d-flex align-center my-5">
          <v-divider></v-divider>
          <span class="px-3 text-caption house-muted">或</span>
          <v-divider></v-divider>
        </div>

        <v-btn
          variant="outlined"
          color="primary"
          block
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="backToLogin"
        >
          返回登录页面
        </v-btn>
      </v-form>
    </v-card>

    <div class="mt-6 text-center text-body-2 house-muted">
      <p>
        还没有账号？
        <router-link to="/auth/signup" class="text-primary font-weight-bold">
          立即注册
        </router-link>
      </p>
      <p class="text-caption mt-2">
        遇到问题？<a href="#" class="text-primary">联系客服</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.reset-wrapper {
  max-width: 440px;
  margin: 24px auto;
}

.reset-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--house-soft);
}

.reset-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--house-ink);
}
</style>
