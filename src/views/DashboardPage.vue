<script setup lang="ts">
import { computed } from "vue";
import { useProfileStore } from "@/stores/profileStore";

const profileStore = useProfileStore();
const userType = computed(() => Number(profileStore.user?.userType));
const isLandlord = computed(() => [0, 2].includes(userType.value));
const userName = computed(() => profileStore.user?.name || "你好");
</script>

<template>
  <section class="dashboard-page pa-4 pa-md-8">
    <div class="dashboard-intro">
      <p class="eyebrow">HAOKE RENTAL</p>
      <h1>{{ userName }}，欢迎回来</h1>
      <p>从这里开始处理今天的租房事务。</p>
    </div>

    <v-row class="mt-2" dense>
      <v-col cols="12" md="7">
        <v-card class="dashboard-card pa-6 h-100" rounded="xl" elevation="0">
          <div class="d-flex align-start justify-space-between ga-4">
            <div>
              <p class="card-kicker">快速开始</p>
              <h2>{{ isLandlord ? "管理你的房源" : "找到合适的住处" }}</h2>
              <p class="mt-2 text-medium-emphasis">
                {{ isLandlord ? "查看已发布房源和租约进度。" : "浏览房源，或把你的需求交给 AI 助手。" }}
              </p>
            </div>
            <v-icon color="primary" size="42">mdi-home-heart</v-icon>
          </div>
          <div class="d-flex flex-wrap ga-3 mt-6">
            <v-btn color="primary" to="/houseList" prepend-icon="mdi-home-search-outline">浏览房源</v-btn>
            <v-btn variant="outlined" color="primary" to="/chat" prepend-icon="mdi-sparkles">咨询 AI 助手</v-btn>
            <v-btn v-if="isLandlord" variant="text" color="primary" to="/my-listings">我的房源</v-btn>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="dashboard-card dashboard-note pa-6 h-100" rounded="xl" elevation="0">
          <p class="card-kicker">租住服务</p>
          <h2>一处清晰的开始</h2>
          <p class="mt-3 text-medium-emphasis">找房、沟通与租约管理都保留在熟悉的位置；不需要从筛选页开始。</p>
          <v-btn class="mt-5" variant="text" color="primary" to="/contract" append-icon="mdi-arrow-right">查看我的租约</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.dashboard-page { max-width: 1180px; margin: 0 auto; }
.dashboard-intro { padding: 20px 0 12px; }
.dashboard-intro h1, h2 { color: #17212b; letter-spacing: -.02em; }
.dashboard-intro h1 { font-size: clamp(2rem, 4vw, 3rem); }
.eyebrow, .card-kicker { color: #0f766e; font-size: .72rem; font-weight: 800; letter-spacing: .13em; }
.dashboard-card { background: #fff; min-height: 250px; }
.dashboard-note { background: #f0f7f7; }
</style>
