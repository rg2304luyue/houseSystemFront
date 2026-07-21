<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-card max-width="500" class="text-center pa-8" elevation="8">
      <v-icon
        color="info"
        size="64"
        class="mb-4"
      >
        mdi-clock-outline
      </v-icon>

      <v-card-title class="text-h5 mb-2">
        支付结果确认中
      </v-card-title>

      <v-card-text class="text-body-1">
        浏览器回跳不能代表支付成功，请前往“我的租约”查看服务器确认后的状态。
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          @click="$router.push('/RentHouse')"
        >
          查看我的租约
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
