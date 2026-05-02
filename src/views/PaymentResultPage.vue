<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-card max-width="500" class="text-center pa-8" elevation="8">
      <v-icon
        :color="isSuccess ? 'success' : 'error'"
        size="64"
        class="mb-4"
      >
        {{ isSuccess ? 'mdi-check-circle' : 'mdi-alert-circle' }}
      </v-icon>

      <v-card-title class="text-h5 mb-2">
        {{ isSuccess ? '支付成功' : '支付失败' }}
      </v-card-title>

      <v-card-text class="text-body-1">
        {{ isSuccess ? '您的订单已支付成功，即将跳转到首页...' : '支付未完成，请返回重试。' }}
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          @click="$router.push('/dashboard')"
        >
          返回首页
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isSuccess = ref(false)

onMounted(() => {
  // 支付宝回跳携带 trade_no 表示支付成功
  const tradeNo = route.query.trade_no
  isSuccess.value = !!tradeNo

  if (isSuccess.value) {
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  }
})
</script>
