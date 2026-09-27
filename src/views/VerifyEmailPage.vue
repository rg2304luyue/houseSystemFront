<script setup lang="ts">
/*
|---------------------------------------------------------------------
| Verify Email Page Component
|---------------------------------------------------------------------
|
| Template to wait for the verification on the user email
|
*/

const TIMEOUT = 5;
const isLoading = ref(false);
const disabled = ref(true);
const times = ref(0);
const seconds = ref("");
const secondsToEnable = ref(TIMEOUT);
const resendInterval = ref();

const setTimer = () => {
  disabled.value = true;
  times.value++;
  secondsToEnable.value = TIMEOUT * times.value;
  resendInterval.value = setInterval(() => {
    if (secondsToEnable.value === 0) {
      clearInterval(resendInterval.value);
      seconds.value = "";
      disabled.value = false;
    } else {
      seconds.value = `( ${secondsToEnable.value} )`;
      secondsToEnable.value--;
    }
  }, 1000);
};

const resend = () => {
  setTimer();
};

onMounted(() => {
  setTimer();
});

onUnmounted(() => {
  clearInterval(resendInterval.value);
});
</script>
<template>
  <div class="auth-form text-center">
    <div class="verify-icon mx-auto mb-5">
      <v-icon size="36" color="primary">mdi-email-fast-outline</v-icon>
    </div>
    <h1 class="auth-title">请验证您的邮箱</h1>
    <p class="house-muted mt-2 mb-6">
      验证链接已发送至您的邮箱，请前往邮箱点击链接完成验证。<br />
      没有收到？请检查垃圾邮件，或稍后重新发送。
    </p>
    <v-btn
      block
      color="primary"
      variant="flat"
      size="large"
      class="font-weight-bold"
      :loading="isLoading"
      :disabled="disabled"
      @click="resend"
      >重新发送邮件{{ seconds }}
    </v-btn>
    <div class="mt-6 text-body-2">
      <router-link to="/auth/signin" class="text-primary">返回登录</router-link>
    </div>
  </div>
</template>

<style scoped>
.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--house-ink);
}

.verify-icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--house-soft);
}
</style>
