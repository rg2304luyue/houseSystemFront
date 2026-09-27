<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/api/client'
import { useSnackbarStore } from "@/stores/snackbarStore";

const snackbarStore = useSnackbarStore();
const router = useRouter()
const route = useRoute()

// 定义props
const props = defineProps<{
  house: any;
  detail: any;
}>();

const currentSlide = ref(0);

const houseId = route.params.id

const navigateToContract = () => {
  if (!props.house.can_sign) return;
  router.push({
    path: '/contract',
    query: { houseid: houseId }
  })
}

const navigateToChat = () => {
  router.push({
    path: '/chat',
    query: { houseId: houseId }
  })
}

const showDatePicker = ref(false);
const selectedDate = ref<Date | null>(null);

const appointmentErrorMessage = (error: any): string => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message;
  }
  return '预约提交失败，请稍后重试';
};

const appointmentDateTime = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 10, 0, 0);
  }
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day, 10, 0, 0);
};

const onDateSelected = async (date: Date | null) => {
  if (!date) return;
  try {
    const appointmentAt = appointmentDateTime(date as Date | string);
    if (appointmentAt <= new Date()) {
      appointmentAt.setTime(Date.now() + 60 * 60 * 1000);
    }
    await apiClient.post('/appointments', {
      time: appointmentAt.toISOString(),
      house_id: Number(houseId)
    });

    snackbarStore.showSuccessMessage('预约日期提交成功！');
    showDatePicker.value = false;
  } catch (error) {
    console.error('提交日期失败:', error);
    snackbarStore.showErrorMessage(appointmentErrorMessage(error));
  }
};

</script>

<template>
  <v-card class="house-hero" flat>
    <v-row no-gutters>
      <!-- 左侧相册 -->
      <v-col cols="12" md="7" class="pa-4">
        <template v-if="detail.photos && detail.photos.length">
          <v-carousel
            v-model="currentSlide"
            height="420"
            hide-delimiter-background
            show-arrows="hover"
            class="hero-carousel"
          >
            <v-carousel-item
              v-for="(item, index) in detail.photos"
              :key="index"
            >
              <img :src="item" class="hero-photo" alt="房源图片" />
            </v-carousel-item>
          </v-carousel>

          <div class="hero-thumbs mt-3">
            <button
              v-for="(item, index) in detail.photos"
              :key="'thumb-' + index"
              type="button"
              class="hero-thumb"
              :class="{ 'hero-thumb--active': currentSlide === index }"
              @click="currentSlide = index"
            >
              <v-img :src="item" :aspect-ratio="4 / 3" cover />
            </button>
          </div>
        </template>
        <div v-else class="house-empty hero-placeholder">
          <v-icon>mdi-image-off-outline</v-icon>
          <span>暂无房源图片</span>
        </div>
      </v-col>

      <!-- 右侧标题价格与操作 -->
      <v-col cols="12" md="5" class="pa-4 pa-md-6 d-flex flex-column">
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip color="primary" variant="tonal" size="small" label>{{ house.rent_type }}</v-chip>
          <v-chip v-if="house.subway" color="info" variant="tonal" size="small" label>近地铁</v-chip>
          <v-chip v-if="house.decoration" variant="tonal" size="small" label>{{ house.decoration }}</v-chip>
          <v-chip :color="house.available ? 'success' : 'error'" variant="tonal" size="small" label>
            {{ house.available ? '已上架' : '已下架' }}
          </v-chip>
        </div>

        <h1 class="hero-title">{{ house.title }}</h1>
        <div class="house-muted text-body-2 d-flex align-center mt-2">
          <v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>
          {{ house.region }}区 · {{ house.block }}街道 · {{ house.community || '未填写' }}
        </div>

        <div class="hero-price-box my-5">
          <span class="house-price hero-price">{{ house.price }}<small>元/月</small></span>
        </div>

        <div class="hero-facts">
          <div class="hero-fact">
            <div class="hero-fact__value">{{ house.rooms }}</div>
            <div class="hero-fact__label">户型</div>
          </div>
          <div class="hero-fact">
            <div class="hero-fact__value">{{ house.area }}㎡</div>
            <div class="hero-fact__label">面积</div>
          </div>
          <div class="hero-fact">
            <div class="hero-fact__value">{{ house.direction }}</div>
            <div class="hero-fact__label">朝向</div>
          </div>
        </div>

        <div class="hero-list mt-4">
          <div class="hero-list__row">
            <span class="house-muted">租赁方式</span><span>{{ house.rent_type }}</span>
          </div>
          <div class="hero-list__row">
            <span class="house-muted">装修</span><span>{{ house.decoration }}</span>
          </div>
          <div class="hero-list__row">
            <span class="house-muted">近地铁</span><span>{{ house.subway ? '是' : '否' }}</span>
          </div>
        </div>

        <div class="hero-landlord mt-4">
          <v-avatar color="primary" variant="tonal" size="40">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
          <div class="ml-3">
            <div class="font-weight-bold">{{ house.landlord }}</div>
            <div class="house-muted text-caption">房东 · {{ house.phone_num }}</div>
          </div>
        </div>

        <v-spacer></v-spacer>

        <!-- 主要操作按钮组 -->
        <div class="action-buttons mt-5">
          <v-btn
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-calendar-clock"
            @click="showDatePicker = !showDatePicker"
            :disabled="!house.can_appoint"
            class="action-btn"
          >
            预约看房
          </v-btn>

          <v-btn
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-file-sign"
            @click="navigateToContract"
            :disabled="!house.can_sign"
            class="action-btn"
          >
            立即签约
          </v-btn>

          <v-btn
            v-if="house.landlord_id"
            color="primary"
            size="large"
            variant="outlined"
            prepend-icon="mdi-chat-processing-outline"
            @click="navigateToChat"
            class="action-btn"
          >
            咨询 AI
          </v-btn>
        </div>
        <v-alert
          v-if="!house.can_sign && house.unavailable_reason"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ house.unavailable_reason }}；如房源仍可预约，可先提交看房申请。
        </v-alert>
      </v-col>
    </v-row>

    <!-- 使用 Vuetify 全局浮层，确保整个页面的遮罩颜色和层级一致。 -->
    <v-dialog v-model="showDatePicker" max-width="600" scrollable>
      <v-card class="date-picker-card" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-3">
          <span class="house-section-title">选择看房日期</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="showDatePicker = false"
          ></v-btn>
        </div>
        <v-date-picker
          color="primary"
          v-model="selectedDate"
          @update:modelValue="onDateSelected"
          class="pa-2"
          width="100%"
        ></v-date-picker>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.house-hero { overflow: hidden; }
.hero-carousel { border-radius: 10px; overflow: hidden; }
.hero-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-placeholder { height: 420px; border-radius: 10px; background: var(--house-soft); }
.hero-thumbs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.hero-thumb {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: .7;
  transition: opacity .2s ease, border-color .2s ease;
}
.hero-thumb:hover { opacity: 1; }
.hero-thumb--active { border-color: rgb(var(--v-theme-primary)); opacity: 1; }

.hero-title { font-size: 1.6rem; font-weight: 700; line-height: 1.35; color: var(--house-ink); letter-spacing: -.01em; }
.hero-price-box { padding: 14px 16px; border-radius: 10px; background: var(--house-soft); }
.hero-price { font-size: 2rem; line-height: 1; }

.hero-facts { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--house-line); border-radius: 10px; }
.hero-fact { padding: 12px 8px; text-align: center; }
.hero-fact + .hero-fact { border-left: 1px solid var(--house-line); }
.hero-fact__value { font-weight: 700; font-size: 1.05rem; color: var(--house-ink); }
.hero-fact__label { font-size: .75rem; color: var(--house-muted); margin-top: 2px; }

.hero-list { display: grid; gap: 8px; font-size: .9rem; }
.hero-list__row { display: flex; justify-content: space-between; gap: 12px; }

.hero-landlord { display: flex; align-items: center; padding-top: 16px; border-top: 1px solid var(--house-line); }

/* 操作按钮组 */
.action-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
.action-btn { flex: 1 1 0; min-width: 120px; font-weight: 600; }

/* 日期选择卡片 */
.date-picker-card { width: 100%; max-height: 90vh; overflow-y: auto; }

@media (max-width: 600px) {
  .date-picker-card { max-height: 80vh; }
  .hero-placeholder { height: 240px; }
  .hero-carousel { height: 260px !important; }
  .hero-title { font-size: 1.3rem; }
  .action-buttons { flex-direction: column; }
  .action-btn { flex: none; width: 100%; }
}
</style>
