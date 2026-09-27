<script setup lang="ts">
import { computed } from "vue";
import { useProfileStore } from "@/stores/profileStore";

const profileStore = useProfileStore();
const userType = computed(() => Number(profileStore.user?.userType));
const isLandlord = computed(() => [0, 2].includes(userType.value));
const userName = computed(() => profileStore.user?.name || "你好");

// 仅用于展示：按当前时间生成问候语与日期
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});
const todayText = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

const flowSteps = [
  { title: "浏览房源", desc: "按区域、价格筛选，查看详情与周边" },
  { title: "预约看房", desc: "在房源详情页选择时间预约实地看房" },
  { title: "在线签约", desc: "确认租期与用途，生成租赁合同" },
  { title: "支付入住", desc: "完成支付，在「我的租约」查看状态" },
];

const shortcuts = computed(() => [
  { title: "找房", desc: "按区域、价格与户型浏览在租房源", icon: "mdi-home-search-outline", to: "/houseList" },
  { title: "AI 助手", desc: "描述需求，让助手帮你筛选与答疑", icon: "mdi-robot-outline", to: "/chat" },
  { title: "待支付合同", desc: "继续支付或取消尚未完成的签约", icon: "mdi-file-document-edit-outline", to: "/contract" },
  { title: "我的租约", desc: "查看租期、房东联系方式与租约状态", icon: "mdi-key-outline", to: "/RentHouse" },
  ...(isLandlord.value
    ? [{ title: "我的房源", desc: "管理已发布房源、上下架与核验状态", icon: "mdi-home-city-outline", to: "/my-listings" }]
    : []),
]);
</script>

<template>
  <section class="dashboard-page">
    <v-card class="dashboard-welcome pa-6 pa-md-8 mb-6" elevation="0">
      <div class="d-flex flex-column flex-md-row align-md-center ga-6">
        <div class="flex-fill">
          <p class="dashboard-eyebrow mb-2">{{ greeting }} · {{ todayText }}</p>
          <h1 class="dashboard-title">{{ userName }}，欢迎回来</h1>
          <p class="house-muted mt-2 mb-0">
            {{ isLandlord ? "查看房源动态与租约进度，从这里开始今天的工作。" : "从这里开始处理今天的租房事务：找房、签约与租约管理。" }}
          </p>
        </div>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary" variant="flat" size="large" to="/houseList" prepend-icon="mdi-home-search-outline">浏览房源</v-btn>
          <v-btn color="primary" variant="tonal" size="large" to="/chat" prepend-icon="mdi-robot-outline">咨询 AI 助手</v-btn>
        </div>
      </div>
    </v-card>

    <h2 class="house-section-title mb-4">快捷入口</h2>
    <div class="shortcut-grid" :class="{ 'shortcut-grid--five': shortcuts.length > 4 }">
      <v-card v-for="item in shortcuts" :key="item.to" :to="item.to" class="shortcut-card house-hover-lift pa-5" elevation="0">
        <div class="shortcut-icon mb-4">
          <v-icon size="26" color="primary">{{ item.icon }}</v-icon>
        </div>
        <div class="d-flex align-center justify-space-between">
          <h3 class="shortcut-title">{{ item.title }}</h3>
          <v-icon size="18" class="house-muted">mdi-arrow-right</v-icon>
        </div>
        <p class="house-muted text-body-2 mt-1 mb-0">{{ item.desc }}</p>
      </v-card>
    </div>

    <v-row class="mt-3">
      <v-col cols="12" md="8">
        <v-card class="pa-6 h-100" elevation="0">
          <h2 class="house-section-title mb-5">租房流程</h2>
          <div class="flow-grid">
            <div v-for="(step, index) in flowSteps" :key="step.title" class="flow-step">
              <div class="flow-index">{{ index + 1 }}</div>
              <div class="font-weight-bold mt-3">{{ step.title }}</div>
              <div class="house-muted text-body-2 mt-1">{{ step.desc }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="dashboard-tip pa-6 h-100 d-flex flex-column" elevation="0">
          <v-icon color="primary" size="32" class="mb-3">mdi-shield-check-outline</v-icon>
          <div class="font-weight-bold mb-1">签约与支付均由服务器核验</div>
          <div class="house-muted text-body-2">租金与签约人身份以服务器为准；支付完成后可在「我的租约」查看确认后的状态。</div>
          <v-spacer />
          <div class="mt-4">
            <v-btn variant="text" color="primary" class="px-0" to="/RentHouse" append-icon="mdi-arrow-right">查看我的租约</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.dashboard-welcome { background: var(--house-surface); }
.dashboard-eyebrow { color: rgb(var(--v-theme-primary)); font-size: .875rem; font-weight: 600; }
.dashboard-title { color: var(--house-ink); font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 700; letter-spacing: -.02em; line-height: 1.25; }
.shortcut-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.shortcut-grid--five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
@media (max-width: 1100px) { .shortcut-grid, .shortcut-grid--five { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.shortcut-card { background: var(--house-surface); min-height: 172px; }
.shortcut-icon { width: 48px; height: 48px; border-radius: var(--house-radius); background: var(--house-soft); display: flex; align-items: center; justify-content: center; }
.shortcut-title { color: var(--house-ink); font-size: 1.05rem; font-weight: 700; }
.flow-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.flow-step { padding: 16px; border-radius: var(--house-radius); border: 1px solid var(--house-line); }
.flow-index { width: 32px; height: 32px; border-radius: 50%; background: var(--house-soft); color: rgb(var(--v-theme-primary)); font-weight: 700; display: flex; align-items: center; justify-content: center; }
@media (max-width: 960px) { .flow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dashboard-tip { background: var(--house-soft); border-color: transparent; box-shadow: none !important; }
@media (max-width: 600px) { .shortcut-grid, .shortcut-grid--five { gap: 12px; } .shortcut-card { min-height: 0; padding: 16px !important; } }
</style>
