<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const username = ref("");
const phone = ref("");
// sign in buttons
const isLoading = ref(false);
const isSignInDisabled = ref(false);

const refLoginForm = ref();
const isFormValid = ref(true);
const email = ref("");
const password = ref("");

// show password field
const showPassword = ref(false);

// Submit
const handleRegister = async () => {
  const { valid } = await refLoginForm.value.validate();
  if (valid) {
    isLoading.value = true;
    isSignInDisabled.value = true;
    try {
      await authStore.registerWithUsernameAndPassword(phone.value, password.value, email.value);
    } catch (err: any) {
      error.value = true;
      errorMessages.value = err?.message || "注册失败，请稍后重试";
    } finally {
      isLoading.value = false;
      isSignInDisabled.value = false;
    }
  } else {
  }
};

// Error Check
const emailRules = ref([
  (v: string) => !!v || "请输入邮箱",
  (v: string) => /.+@.+\..+/.test(v) || "邮箱格式不正确",
]);

const usernameRules = ref([(v: string) => !!v || "请输入手机号"]);

// 与后端 min_length=6、登录页 20 字符上限保持一致
const passwordRules = ref([
  (v: string) => !!v || "请输入密码",
  (v: string) => (v && v.length >= 6) || "密码至少 6 个字符",
  (v: string) => (v && v.length <= 20) || "密码长度不能超过20个字符",
]);



const error = ref(false);
const errorMessages = ref("");

const resetErrors = () => {
  error.value = false;
  errorMessages.value = "";
};
</script>
<template>
  <div class="auth-form">
    <header class="mb-6">
      <h1 class="auth-title">创建账号</h1>
      <p class="house-muted mt-1">注册后即可收藏房源、预约看房与在线签约</p>
    </header>

    <v-form
      ref="refLoginForm"
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
        :rules="usernameRules"
        name="username"
        prepend-inner-icon="mdi-cellphone"
        class="mb-2"
        validateOn="blur"
        @keyup.enter="handleRegister"
        @change="resetErrors"
      ></v-text-field>

      <v-text-field
        ref="refEmail"
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
        validateOn="blur"
        @keyup.enter="handleRegister"
        @change="resetErrors"
      ></v-text-field>

      <v-text-field
        ref="refPassword"
        v-model="password"
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        :error="error"
        :error-messages="errorMessages"
        label="密码"
        placeholder="请设置登录密码"
        color="primary"
        :rules="passwordRules"
        name="password"
        prepend-inner-icon="mdi-lock-outline"
        validateOn="blur"
        @change="resetErrors"
        @keyup.enter="handleRegister"
        @click:append-inner="showPassword = !showPassword"
      ></v-text-field>

      <v-btn
        :loading="isLoading"
        :disabled="isSignInDisabled"
        block
        size="large"
        color="primary"
        variant="flat"
        @click="handleRegister"
        class="mt-2 font-weight-bold"
        >创建账号</v-btn
      >

      <p class="mt-4 text-caption text-center house-muted">
        注册即表示您同意
        <router-link class="text-primary" to="">服务条款</router-link>
        与
        <router-link class="text-primary" to="">隐私政策</router-link>
      </p>
    </v-form>

    <div class="mt-6 text-center text-body-2 house-muted">
      已有账号？
      <router-link to="/auth/signin" class="text-primary font-weight-bold">
        立即登录
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
</style>
