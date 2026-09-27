<!--
* @Component: 用户租房列表
* @Maintainer: J.K. Yang
* @Description: 显示当前用户租赁的房源列表
-->
<script setup lang="ts">
import { useProfileStore } from "@/stores/profileStore";
import { ref, computed, onMounted } from "vue";
import apiClient from "@/api/client";

// 定义房源类型
interface RentalProperty {
  id: number;
  title: string;
  region: string;
  purpose: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'upcoming' | 'unknown';
  landlord_username: string;
  rentValue: string;
  landlordPhone: string;
  isLegacy: boolean;
}

// 获取当前用户
const profileStore = useProfileStore();
const currentUser = ref(profileStore.user.name);


// 房源数据
const rentalProperties = ref<RentalProperty[]>([]);

// 加载状态
const loading = ref(false);
const error = ref<string | null>(null);

const localDay = (value: Date): number => (
  value.getFullYear() * 10000 + (value.getMonth() + 1) * 100 + value.getDate()
);

// 从后端获取房源数据
const fetchRentalProperties = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get(`/leases/mine`);
    const records = Array.isArray(response.data) ? response.data : [];
    rentalProperties.value = records
      .map((record: any) => {
        const house = record.house || {};
        const property = { ...record, ...house, ...(record.contract || {}) };
        const currentDate = new Date();
        const startDate = property.startDate ? new Date(property.startDate) : null;
        const endDate = property.endDate ? new Date(property.endDate) : null;
        
        let status: 'active' | 'expired' | 'upcoming' | 'unknown' = 'unknown';
        if (startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
          status = 'active';
        }
        if (endDate && !Number.isNaN(endDate.getTime()) && localDay(currentDate) > localDay(endDate)) {
          status = 'expired';
        } else if (startDate && !Number.isNaN(startDate.getTime()) && localDay(currentDate) < localDay(startDate)) {
          status = 'upcoming';
        }
        
        return {
          id: record.id,
          title: house.title || property.houseTitle || `房源 ${record.house_id}（资料暂不可用）`,
          region: house.region || property.region || '',
          purpose: property.purpose || '历史数据未记录',
          startDate: property.startDate || '历史数据未记录',
          endDate: property.endDate || '历史数据未记录',
          status: status,
          landlord_username: property.landlordName || record.landlord_username || '历史数据未记录',
          rentValue: property.rentValue ?? house.price ?? '历史数据未记录',
          landlordPhone: property.landlordPhone || '历史数据未记录',
          isLegacy: !record.contract
        };
      });
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '获取房源数据失败';
    console.error('获取房源数据失败:', err);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchRentalProperties();
});

const searchKey = ref("");

// 根据搜索关键词过滤房源列表
const filteredProperties = computed(() => {
  return rentalProperties.value.filter(property => {
    return (
      (property.title ?? "").toLowerCase().includes(searchKey.value.toLowerCase()) ||
      (property.region ?? "").toLowerCase().includes(searchKey.value.toLowerCase()) ||
      (property.landlord_username ?? "").toLowerCase().includes(searchKey.value.toLowerCase()) ||
      (property.landlordPhone ?? "").toLowerCase().includes(searchKey.value.toLowerCase())
    );
  });
});

// 获取状态对应的颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'expired':
      return 'error';
    case 'upcoming':
      return 'warning';
    case 'unknown':
      return 'info';
    default:
      return 'info';
  }
};

</script>

<template>
  <section class="rent-page">
    <!-- 标题和搜索框 -->
    <div class="d-flex align-center flex-wrap ga-4 mb-5">
      <div class="flex-fill">
        <h2 class="house-section-title">{{ currentUser }}的租约</h2>
        <p class="house-muted text-body-2 mb-0">共 {{ rentalProperties.length }} 份租约记录</p>
      </div>
      <v-text-field
        v-model="searchKey"
        clearable
        hide-details
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        placeholder="搜索房源/房东/电话"
        class="rent-search"
      ></v-text-field>
    </div>

    <!-- 加载状态 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

    <!-- 错误提示 -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- 租约列表 -->
    <transition-group name="fade" tag="div">
      <v-card
        v-for="property in filteredProperties"
        :key="property.id"
        class="rent-card house-hover-lift mb-3 pa-4"
        elevation="0"
      >
        <div class="rent-row">
          <!-- 房源图片占位（租约数据未包含房源图片） -->
          <div class="rent-thumb">
            <v-icon size="36" color="primary">mdi-home-outline</v-icon>
          </div>

          <!-- 房源信息 -->
          <div class="rent-info">
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
              <h3 class="rent-title">{{ property.title }}</h3>
              <v-chip :color="getStatusColor(property.status)" size="small" variant="tonal">
                {{
                  property.status === 'active' ? '租赁中' :
                  property.status === 'expired' ? '已到期' :
                  property.status === 'upcoming' ? '即将入住' : '历史状态未知'
                }}
              </v-chip>
              <v-chip v-if="property.isLegacy" color="info" size="small" variant="tonal">
                历史记录
              </v-chip>
            </div>

            <div class="house-muted text-body-2 mb-2">
              <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>{{ property.region || '未知区域' }}
              <span class="mx-2">·</span>用途：{{ property.purpose }}
            </div>

            <div class="rent-meta text-body-2">
              <span><span class="house-muted">房东</span> {{ property.landlord_username }}</span>
              <span><span class="house-muted">电话</span> {{ property.landlordPhone }}</span>
              <span><span class="house-muted">起租</span> {{ property.startDate }}</span>
              <span><span class="house-muted">到期</span> {{ property.endDate }}</span>
            </div>
          </div>

          <div class="rent-side">
            <div class="house-price text-h6">¥{{ property.rentValue }}<small>/月</small></div>
          </div>
        </div>
      </v-card>
    </transition-group>

    <!-- 无租约提示 -->
    <v-card v-if="!loading && filteredProperties.length === 0" elevation="0">
      <div class="house-empty">
        <v-icon>mdi-home-search-outline</v-icon>
        <div>{{ searchKey ? '没有找到符合条件的租约' : '暂无租约记录' }}</div>
        <v-btn v-if="!searchKey" color="primary" variant="tonal" class="mt-2" to="/houseList">去找房</v-btn>
      </div>
    </v-card>
  </section>
</template>

<style scoped lang="scss">
.rent-search { max-width: 320px; min-width: 220px; }
.rent-row { display: flex; align-items: center; gap: 16px; }
.rent-thumb {
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  border-radius: var(--house-radius);
  background: var(--house-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rent-info { flex: 1 1 auto; min-width: 0; }
.rent-title { color: var(--house-ink); font-size: 1.05rem; font-weight: 700; }
.rent-meta { display: flex; flex-wrap: wrap; gap: 4px 20px; color: var(--house-ink); }
.rent-side { flex: 0 0 auto; text-align: right; }

@media (max-width: 600px) {
  .rent-search { max-width: none; width: 100%; }
  .rent-row { flex-wrap: wrap; align-items: flex-start; }
  .rent-thumb { flex-basis: 64px; width: 64px; height: 64px; }
  .rent-info { flex-basis: calc(100% - 80px); }
  .rent-side { width: 100%; text-align: left; }
}
</style>
