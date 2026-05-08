<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router'
import { useFixCardStore } from '@/stores/fixCardStore'

const router = useRouter()
const route = useRoute()
const fixCardStore = useFixCardStore()

// 定义props
const props = defineProps<{
  house: any;
  detail: any;
}>();

const form = ref({
  house_num: '',
  title: '整租·锦源小区 2室1厅 南',
  region: '雨花',
  block: '树木岭',
  community: '锦源小区',
  area: 80,
  direction: '南',
  rooms: '2室1厅1卫',
  price: 3200,
  rent_type: '整租',
  decoration: '精装',
  subway: 1,
  available: 1,
  tag_new: 1,
  landlord: '张先生',
  phone_num: '13888888888',
  photos: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1494526585095-c41746248156',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e'
  ],
  videos: []
});

const currentSlide = ref(0);

const mediaList = computed(() => {
  return form.value.videos.length > 0 ? form.value.videos : form.value.photos;
});

function onBookVisit() {
  alert('预约看房功能暂未实现');
}

const houseId = route.params.id

const navigateToContract = () => {
  router.push({
    path: '/contract',
    query: { rent: props.house.price ,
            landlord: props.house.landlord,
            phone: props.house.phone_num,
            houseid: houseId
    }
  })
}

const navigateToChat = () => {
  router.push({
    path: '/chat',
    query: { landlord: props.house.landlord,
            phone: props.house.phone_num
    }
  })
}

const showDatePicker = ref(false);
const selectedDate = ref(null);

const onDateSelected = async (date: string | Date) => {
  console.log("选择的日期是：", date);

  const token = localStorage.getItem('token');
  let username = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.phone || payload.email || payload.user_id || '';
    } catch (e) {
      console.error('token解析失败', e);
    }
  }

  try {
    const response = await fetch('http://localhost:5000/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        time: date.toISOString(),
        property: props.house.title
      })
    });

    if (!response.ok) {
      throw new Error('网络响应不正常');
    }

    const data = await response.json();
    console.log('后端响应:', data);
    alert('预约日期提交成功！');
    showDatePicker.value = false;
  } catch (error) {
    console.error('提交日期失败:', error);
    alert('提交日期失败，请稍后再试');
  }
};

// 打开报修弹窗
const openRepairCard = () => {
  fixCardStore.setCurrentProperty({
    id: props.house.id,
    title: props.house.title,
    region: `${props.house.region}区${props.house.block}${props.house.community}`,
    landlord_username: props.house.landlord,
  })
  fixCardStore.setFixType('repair')
  fixCardStore.toggleFixCard()
}

// 打开投诉弹窗
const openComplainCard = () => {
  fixCardStore.setCurrentProperty({
    id: props.house.id,
    title: props.house.title,
    region: `${props.house.region}区${props.house.block}${props.house.community}`,
    landlord_username: props.house.landlord,
  })
  fixCardStore.setFixType('complain')
  fixCardStore.toggleFixCard()
}

</script>

<template>
  <v-card class="my-5 pa-5" rounded>
    <v-row>
      <!-- 左侧大图轮播 -->
      <v-col cols="12" md="6">
        <v-carousel
          v-model="currentSlide"
          height="400"
          hide-delimiter-background
          show-arrows="hover"
        >
          <v-carousel-item
            v-for="(item, index) in detail.photos"
            :key="index"
          >
            <img
              :src="item"
              style="width: 100%; height: 100%; object-fit: cover"
            />
          </v-carousel-item>
        </v-carousel>

        <v-row class="mt-3" dense justify="center">
      <v-col
        v-for="(item, index) in detail.photos"
        :key="'thumb-' + index"
        cols="3"
        class="d-flex justify-center"
      >
        <v-img
          :src="item"
          :class="currentSlide === index ? 'border border-primary' : ''"
          style="cursor: pointer"
          height="60"
          width="100"
          cover
          @click="currentSlide = index"
        />
      </v-col>
    </v-row>

      </v-col>

      <!-- 右侧信息区域 -->
     <v-col cols="12" md="6" class="d-flex align-center">
  <div style="width: 100%; max-width: 500px; margin: auto; line-height: 1.6;">
    <h2 class="text-h4 font-weight-bold mb-5">{{ house.title }}</h2>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
      <span>位置：{{ house.region }}区 · {{ house.block }}街道 · {{ form.community }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-ruler-square</v-icon>
      <span>面积：{{ house.area }}㎡</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-compass-outline</v-icon>
      <span>朝向：{{ house.direction }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-home-floor-2</v-icon>
      <span>户型：{{ house.rooms }}</span>
    </div>

    <div class="d-flex align-center mb-3" style="color: #d32f2f; font-weight: 600;">
      <v-icon color="#d32f2f" class="mr-2">mdi-cash</v-icon>
      <span>租金：{{ house.price }} 元/月</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-file-document-outline</v-icon>
      <span>租赁方式：{{ house.rent_type }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-brush</v-icon>
      <span>装修：{{ house.decoration }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-subway-variant</v-icon>
      <span>是否近地铁：{{ house.subway ? '是' : '否' }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-eye-check</v-icon>
      <span>是否随时看房：{{ house.available ? '是' : '否' }}</span>
    </div>

    <div class="d-flex align-center mb-3">
      <v-icon color="primary" class="mr-2">mdi-account</v-icon>
      <span>房东：{{ house.landlord }}（{{ house.phone_num }}）</span>
    </div>

    <!-- 主要操作按钮组 -->
    <div class="action-buttons mt-4">
      <v-btn
        color="#4CAF50"
        size="large"
        variant="elevated"
        prepend-icon="mdi-file-sign"
        @click="navigateToContract"
        class="action-btn"
      >
        立即签约
      </v-btn>

      <v-btn
        color="#FF5722"
        size="large"
        variant="elevated"
        prepend-icon="mdi-chat-processing"
        @click="navigateToChat"
        class="action-btn"
      >
        咨询房东
      </v-btn>

      <v-btn
        color="#1976D2"
        size="large"
        variant="elevated"
        prepend-icon="mdi-calendar-clock"
        @click="showDatePicker = !showDatePicker"
        class="action-btn"
      >
        预约看房
      </v-btn>
    </div>

    <!-- 辅助操作按钮组（报修/投诉） -->
    <div class="secondary-actions mt-3">
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-tools"
        @click="openRepairCard"
        class="secondary-btn"
      >
        申报维修
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-alert-circle-outline"
        @click="openComplainCard"
        class="secondary-btn"
      >
        投诉房东
      </v-btn>
    </div>


    <!-- 背景遮罩 -->
  <div
    v-if="showDatePicker"
    class="date-picker-backdrop"
    @click="showDatePicker = false"
  ></div>

  <!-- 日期选择器 -->
  <div v-if="showDatePicker" class="date-picker-container">
    <v-card class="date-picker-card" elevation="10" rounded="lg">
      <v-card-actions class="d-flex justify-end pa-0 ma-0">
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="showDatePicker = false"
          class="ma-1"
        ></v-btn>
      </v-card-actions>
      <v-date-picker
        color="primary"
        v-model="selectedDate"
        @update:modelValue="onDateSelected"
        class="pa-2"
        width="100%"
      ></v-date-picker>
    </v-card>
  </div>

    <v-spacer></v-spacer>
  </div>
</v-col>

    </v-row>
  </v-card>

</template>

<style scoped>
.text-red {
  color: #e53935;
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  border-radius: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12) !important;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 辅助操作按钮组 */
.secondary-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.secondary-btn {
  color: #888 !important;
  font-size: 0.8rem;
  transition: color 0.2s;
}

.secondary-btn:hover {
  color: #555 !important;
}

/*日期选择部分浮动设置*/
.date-picker-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  padding: 0px;
  border-radius: 5px;
}

/* 日期选择器容器 */
.date-picker-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000 !important;
  width: 90%;
  max-width: 600px;
  isolation: isolate;
}

/* 日期选择卡片 */
.date-picker-card {
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 背景遮罩 */
.date-picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .date-picker-container {
    width: 95%;
  }
  .date-picker-card {
    max-height: 80vh;
  }
  .action-buttons {
    flex-direction: column;
  }
  .action-btn {
    width: 100%;
  }
}
</style>
