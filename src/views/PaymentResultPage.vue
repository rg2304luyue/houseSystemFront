<template>
  <section class="payment-result d-flex align-center justify-center">
    <v-card max-width="480" width="100%" class="text-center pa-8 pa-sm-10" elevation="0">
      <div class="result-icon mx-auto mb-5">
        <v-icon color="info" size="56">mdi-clock-outline</v-icon>
      </div>

      <h1 class="result-title mb-2">支付结果确认中</h1>

      <p class="house-muted text-body-1 mb-6">
        浏览器回跳不能代表支付成功，请前往“我的租约”查看服务器确认后的状态。
      </p>

      <div class="d-flex flex-column flex-sm-row justify-center ga-3">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          @click="$router.push('/RentHouse')"
        >
          查看我的租约
        </v-btn>
      </div>
    </v-card>
  </section>
</template>

<style scoped>
.payment-result { min-height: 60vh; }
.result-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-info), .12);
}
.result-title { color: var(--house-ink); font-size: 1.5rem; font-weight: 700; letter-spacing: -.01em; }
</style>
