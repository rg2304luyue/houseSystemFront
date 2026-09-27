<template>
<div class="house-list-page">
  <v-card class="filter-panel mb-6" flat>
    <div class="filter-head">
      <h1 class="house-section-title">找房</h1>
      <span class="house-muted text-body-2">按区域、租金、户型快速筛选长沙好房</span>
    </div>
    <v-text-field
      v-model="searchFilters.community"
      placeholder="请输入区域、商圈或小区名开始找房"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="filter-search"
      @keyup.enter="applyFiltersAndResetPage"
    ></v-text-field>

    <div class="filter-rows">
      <div class="filter-row">
        <div class="filter-label">区域</div>
        <v-chip-group
          v-model="searchFilters.region"
          column
          multiple
          color="primary"
          class="filter-options"
        >
          <v-chip
            v-for="region in availableRegions"
            :key="region.value"
            :value="region.value"
            label
            size="small"
            variant="tonal"
            class="filter-chip"
          >
            {{ region.text }}
          </v-chip>
        </v-chip-group>
      </div>

      <div class="filter-row">
        <div class="filter-label">方式</div>
        <v-chip-group
          v-model="searchFilters.rent_type"
          mandatory
          column
          color="primary"
          class="filter-options"
        >
          <v-chip value="" label size="small" variant="tonal" class="filter-chip">不限</v-chip>
          <v-chip value="整租" label size="small" variant="tonal" class="filter-chip">整租</v-chip>
          <v-chip value="合租" label size="small" variant="tonal" class="filter-chip">合租</v-chip>
        </v-chip-group>
      </div>

      <div class="filter-row">
        <div class="filter-label">租金</div>
        <div class="filter-options filter-options--price">
          <v-chip-group
            v-model="selectedRentRange"
            column
            color="primary"
            @update:model-value="onRentRangeChange"
          >
            <v-chip value="all" label size="small" variant="tonal" class="filter-chip">不限</v-chip>
            <v-chip v-for="range in rentRanges" :key="range.label" :value="range.label" label size="small" variant="tonal" class="filter-chip">
              {{ range.label }}
            </v-chip>
          </v-chip-group>
          <div class="price-custom">
            <v-text-field
              v-model.number="customMinPrice"
              placeholder="最低价"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              class="price-input"
            ></v-text-field>
            <span class="house-muted">—</span>
            <v-text-field
              v-model.number="customMaxPrice"
              placeholder="最高价"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              class="price-input"
            ></v-text-field>
            <v-btn color="primary" variant="outlined" size="small" @click="applyCustomPriceRange">确定</v-btn>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-label">户型</div>
        <v-chip-group
          v-model="searchFilters.rooms"
          column
          multiple
          color="primary"
          class="filter-options"
        >
          <v-chip value="一居" label size="small" variant="tonal" class="filter-chip">一居</v-chip>
          <v-chip value="两居" label size="small" variant="tonal" class="filter-chip">两居</v-chip>
          <v-chip value="三居" label size="small" variant="tonal" class="filter-chip">三居</v-chip>
          <v-chip value="四居" label size="small" variant="tonal" class="filter-chip">四居</v-chip>
          <v-chip value="四居+" label size="small" variant="tonal" class="filter-chip">四居+</v-chip>
        </v-chip-group>
      </div>

      <div class="filter-row">
        <div class="filter-label">朝向</div>
        <v-chip-group
          v-model="searchFilters.orientation"
          column
          multiple
          color="primary"
          class="filter-options"
        >
          <v-chip v-for="o in orientations" :key="o" :value="o" label size="small" variant="tonal" class="filter-chip">{{ o }}</v-chip>
        </v-chip-group>
      </div>
    </div>

    <div class="filter-actions">
      <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="resetFilters" :disabled="loading">
        重置
      </v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-filter-variant" @click="applyFiltersAndResetPage" :loading="loading">
        应用筛选
      </v-btn>
    </div>
  </v-card>

  <div class="list-container">
    <v-alert v-if="loadError && !loading" type="error" variant="tonal" class="mb-4" closable @click:close="loadError = ''">
      {{ loadError }}
      <template #append><v-btn size="small" variant="text" @click="loadHouses">重试</v-btn></template>
    </v-alert>
    <v-progress-linear
      v-if="loading && hasLoaded"
      indeterminate
      color="primary"
      class="results-progress"
    ></v-progress-linear>

    <div v-if="loading && !hasLoaded" class="house-empty">
      <v-progress-circular indeterminate color="primary" size="44"></v-progress-circular>
      <p>正在加载房源数据...</p>
    </div>

    <v-row v-else-if="houses.length > 0">
      <v-col cols="12" md="8">
        <div class="mb-3">
          <span class="house-muted text-body-2">共找到 <strong class="text-primary">{{ pagination.total }}</strong> 套房源</span>
        </div>
        <v-card
          v-for="house in houses"
          :key="house.id"
          class="mb-4 house-card house-hover-lift"
          flat
          @click="goToHouseDetail(house.id)"
          role="link"
          tabindex="0"
          @keydown.enter="goToHouseDetail(house.id)"
          @keydown.space.prevent="goToHouseDetail(house.id)"
        >
          <div class="house-card__body">
            <div class="house-card__media">
              <v-img
                cover
                :src="house.image_url || 'https://cdn.vuetifyjs.com/images/cards/docks.jpg'"
                :aspect-ratio="4 / 3"
                class="house-image"
              ></v-img>
            </div>

            <div class="house-card__info">
              <div>
                <h3 class="house-card__title">{{ house.title }}</h3>
                <div class="house-muted text-body-2 mb-2">
                  <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>{{ house.community }}{{ house.block ? ` · ${house.block}` : '' }}
                </div>
                <div class="house-card__meta mb-3">
                  <span>{{ house.rooms }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ house.area }}m²</span>
                  <span class="meta-dot">·</span>
                  <span>{{ house.direction }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ house.decoration || '简装' }}</span>
                </div>
                <div class="house-card__tags">
                  <v-chip v-if="house.subway === 1" color="info" variant="tonal" size="small" label>近地铁</v-chip>
                  <v-chip v-if="house.tag_new === 1" color="warning" variant="tonal" size="small" label>新上房源</v-chip>
                  <v-chip v-if="house.available === 1" color="success" variant="tonal" size="small" label>随时可看</v-chip>
                  <v-chip color="primary" variant="tonal" size="small" label>{{ house.rent_type }}</v-chip>
                </div>
              </div>

              <div class="house-card__footer">
                <div class="house-muted text-caption house-card__publisher">
                  <span><v-icon size="14" class="mr-1">mdi-account-circle-outline</v-icon>{{ house.landlord || '个人房源' }}</span>
                  <span><v-icon size="14" class="mr-1">mdi-clock-time-eight-outline</v-icon>{{ formatPublishTime(house.publish_time) }}</span>
                </div>
                <div class="house-price house-card__price">
                  {{ house.price }}<small>元/月</small>
                </div>
              </div>
            </div>
          </div>
        </v-card>
        <v-pagination
          v-if="pagination.pages > 1"
          v-model="pagination.page"
          :length="pagination.pages"
          active-color="primary"
          class="mt-5"
          density="comfortable"
        ></v-pagination>
      </v-col>

      <v-col cols="12" md="4">
        <div class="side-sticky">
          <v-card class="recommendation-card" flat>
            <div class="px-4 pt-4 pb-2">
              <div class="d-flex align-center">
                <v-icon color="accent" class="mr-2">mdi-fire</v-icon>
                <h2 class="house-section-title">热门推荐</h2>
              </div>
              <div class="house-muted text-caption mt-1">周边好房不容错过</div>
            </div>

            <v-card-text class="pt-2">
              <template v-if="loadingRecommendation">
                <v-skeleton-loader type="image, article"></v-skeleton-loader>
              </template>

              <template v-else-if="recommendedHouse">
                <v-img
                  v-if="recommendedHouse.image_url"
                  :src="recommendedHouse.image_url"
                  :aspect-ratio="16 / 10"
                  cover
                  class="house-image mb-3"
                ></v-img>
                <div class="d-flex align-center mb-2">
                  <v-chip variant="tonal" color="primary" size="small" label class="mr-2">
                    {{ recommendedHouse.rent_type || '整租' }}
                  </v-chip>
                  <span class="rec-title">
                    {{ recommendedHouse.title.split(' ')[0] || '尚鑫海悦' }}
                  </span>
                </div>

                <div class="house-card__meta mb-3">
                  <span>{{ recommendedHouse.rooms || '1室0厅' }}</span>
                  <template v-if="recommendedHouse.area">
                    <span class="meta-dot">·</span>
                    <span>{{ recommendedHouse.area }}m²</span>
                  </template>
                  <template v-if="recommendedHouse.direction">
                    <span class="meta-dot">·</span>
                    <span>{{ recommendedHouse.direction }}</span>
                  </template>
                  <template v-if="recommendedHouse.decoration">
                    <span class="meta-dot">·</span>
                    <span>{{ recommendedHouse.decoration }}</span>
                  </template>
                </div>

                <div class="d-flex align-center justify-space-between">
                  <div class="house-muted text-caption d-flex align-center">
                    <v-avatar color="primary" variant="tonal" size="26" class="mr-2">
                      <v-icon icon="mdi-account" size="16"></v-icon>
                    </v-avatar>
                    {{ recommendedHouse.landlord || '个人房源' }}
                  </div>
                  <span class="house-price text-h6">
                    {{ recommendedHouse.price }}<small>元/月</small>
                  </span>
                </div>
              </template>

              <div v-else class="house-empty py-6">
                <v-icon>mdi-home-search-outline</v-icon>
                <span>暂无热门推荐</span>
              </div>
            </v-card-text>

            <v-card-actions class="px-4 pb-4 pt-0">
              <v-btn
                color="primary"
                variant="tonal"
                block
                append-icon="mdi-arrow-right"
                :disabled="!recommendedHouse"
                @click="recommendedHouse && goToHouseDetail(recommendedHouse.id)"
              >
                查看详情
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-card v-else-if="!loading && houses.length === 0" flat>
      <div class="house-empty">
        <v-icon>mdi-home-alert-outline</v-icon>
        <p class="text-h6">抱歉，没有找到符合条件的房源</p>
        <p class="text-body-2">请尝试调整您的筛选条件或稍后再试。</p>
      </div>
    </v-card>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
// Import the actual config type with a different name to avoid conflict with component's filter state type
import { fetchHouses, type HouseInfo, type HouseFilters as ApiHouseFiltersConfig, type PaginatedHouseResponse } from '@/api/houseApi';
import apiClient from '@/api/client';

const router = useRouter();

// Interface for the component's reactive searchFilters state
interface ComponentSearchFilters {
  page: number;
  per_page: number;
  community: string;    // Main search input
  region: string[];     // Array for multi-select
  rent_type: string;    // Single select (or empty for 'any')
  min_price?: number;
  max_price?: number;
  rooms: string[];      // Array for multi-select
  orientation: string[];// Array for multi-select
}

const searchFilters = reactive<ComponentSearchFilters>({
  page: 1, // Default to page 1 for API, pagination state handles current page
  per_page: 12,
  community: '',
  region: [],
  rent_type: '', // Empty string for '不限' (any)
  min_price: undefined,
  max_price: undefined,
  rooms: [],
  orientation: [],
});

const houses = ref<HouseInfo[]>([]);
const loading = ref(true); // Start with loading true
const hasLoaded = ref(false);
const loadError = ref("");
let latestRequestId = 0;
const pagination = reactive({
  page: 1,
  per_page: searchFilters.per_page, // Align with searchFilters
  total: 0,
  pages: 0,
});

function formatPublishTime(timeStr: string): string {
  if (!timeStr) return '未知';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr; // Return original if date is invalid

    const now = new Date();
    const diffTime = now.getTime() - date.getTime(); // No Math.abs, we expect publish_time to be in the past
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return date.toLocaleDateString(); // Older than 30 days, show date
    if (diffDays >= 1) return `${diffDays}天前发布`;
    if (diffHours >= 1) return `${diffHours}小时前发布`;
    if (diffMinutes >= 1) return `${diffMinutes}分钟前发布`;
    return "刚刚发布";
  } catch (e) {
    return timeStr; // Fallback to original string if any error during parsing
  }
}

const availableRegions = ref([
  { text: '岳麓', value: '岳麓' }, { text: '雨花', value: '雨花' },
  { text: '天心', value: '天心' }, { text: '芙蓉', value: '芙蓉' },
  { text: '望城', value: '望城' }, { text: '长沙县', value: '长沙县' }
]);

const rentRanges = ref([
  { label: '≤2000元', value: { min: undefined, max: 2000 } },
  { label: '2000-3000元', value: { min: 2000, max: 3000 } },
  { label: '3000-4000元', value: { min: 3000, max: 4000 } },
  { label: '4000-5000元', value: { min: 4000, max: 5000 } },
  { label: '5000-6000元', value: { min: 5000, max: 6000 } },
  { label: '≥6000元', value: { min: 6000, max: undefined } },
]);
// For rent range chip group, null value represents "不限"
const selectedRentRange = ref<string>('all');
const customMinPrice = ref<number | undefined>();
const customMaxPrice = ref<number | undefined>();
const orientations = ref(['东', '南', '西', '北', '南北', '东西', '东北', '西北', '东南', '西南']);

// 通过 @update:model-value 事件同步租金范围
// 去掉 mandatory 避免 Vuetify 重渲染时内部强制重置选项
const onRentRangeChange = (label: string | undefined) => {
  if (label && label !== 'all') {
    const range = rentRanges.value.find(r => r.label === label);
    if (range) {
      searchFilters.min_price = range.value.min;
      searchFilters.max_price = range.value.max;
      customMinPrice.value = undefined;
      customMaxPrice.value = undefined;
    }
  } else {
    // 用户点击"不限"或取消选择 → 清除价格筛选
    searchFilters.min_price = undefined;
    searchFilters.max_price = undefined;
  }
};

const applyCustomPriceRange = () => {
  // Basic validation for custom price
  if (customMinPrice.value !== undefined && customMaxPrice.value !== undefined && customMinPrice.value > customMaxPrice.value) {
    // Handle error - e.g., show a snackbar
    console.error("最低价不能高于最高价");
    return;
  }
  searchFilters.min_price = customMinPrice.value;
  searchFilters.max_price = customMaxPrice.value;
  selectedRentRange.value = 'all'; // Deselect preset range chip
  applyFiltersAndResetPage();
}

const loadHouses = async () => {
  const requestId = ++latestRequestId;
  loading.value = true;
  try {
    // Prepare API parameters from component's searchFilters state
    const apiParams: ApiHouseFiltersConfig = {
      page: pagination.page,
      per_page: pagination.per_page,
      available: 1,
    };

    if (searchFilters.community) apiParams.community = searchFilters.community;
    if (searchFilters.rent_type) apiParams.rent_type = searchFilters.rent_type;
    if (searchFilters.min_price !== undefined) apiParams.min_price = searchFilters.min_price;
    if (searchFilters.max_price !== undefined) apiParams.max_price = searchFilters.max_price;

    if (searchFilters.region && searchFilters.region.length > 0) {
      apiParams.region = searchFilters.region.join(',');
    }
    if (searchFilters.rooms && searchFilters.rooms.length > 0) {
      apiParams.rooms = searchFilters.rooms.join(',');
    }
    if (searchFilters.orientation && searchFilters.orientation.length > 0) {
      apiParams.orientation = searchFilters.orientation.join(',');
    }

    const response = await fetchHouses(apiParams);
    if (requestId !== latestRequestId) return;

    houses.value = response.items;
    loadError.value = "";
    pagination.total = response.total;
    pagination.pages = response.pages;
    pagination.per_page = response.per_page;

  } catch (error) {
    if (requestId !== latestRequestId) return;
    console.error("Failed to load houses in component:", error);
    loadError.value = "房源加载失败，请稍后重试";
    if (!hasLoaded.value) {
      houses.value = [];
      pagination.total = 0;
      pagination.pages = 0;
    }
    // snackbarStore.showErrorMessage('加载房源失败，请稍后再试');
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false;
      hasLoaded.value = true;
    }
  }
};

// 改后：只有用户手动翻页才触发，loadHouses 内部同步 page 不触发
watch(() => pagination.page, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    loadHouses();
  }
});

const applyFiltersAndResetPage = () => {
  if (pagination.page === 1) {
    loadHouses();
  } else {
    // The pagination watcher performs the request after resetting the page.
    pagination.page = 1;
  }
};

const resetFilters = () => {
  searchFilters.community = '';
  searchFilters.region = [];
  searchFilters.rent_type = ''; // Reset to "不限"
  selectedRentRange.value = 'all'; // This will trigger watch to clear min/max price in searchFilters
  customMinPrice.value = undefined;
  customMaxPrice.value = undefined;
  searchFilters.rooms = [];
  searchFilters.orientation = [];
  
  // Ensure min_price and max_price are cleared if not handled by selectedRentRange watch
  searchFilters.min_price = undefined; 
  searchFilters.max_price = undefined;

  applyFiltersAndResetPage();
};

const goToHouseDetail = (houseId: number) => {
  router.push(`/houses/${houseId}`);
};

// 添加热门推荐房源的接口类型
interface RecommendedHouse {
  id: number;
  title: string;
  community: string | null;
  block: string | null;
  area: number;
  price: number;
  rent_type: string;
  rooms: string;
  direction: string | null;
  decoration: string;
  landlord: string;
  image_url: string;
  publish_time: string;
}

// 添加热门推荐房源的状态
const recommendedHouse = ref<RecommendedHouse | null>(null);
const loadingRecommendation = ref(false);

// 添加获取热门推荐的方法
const fetchRecommendedHouse = async () => {
  loadingRecommendation.value = true;
  try {
    const response = await apiClient.get('/houses/most-viewed');
    // 响应拦截器已自动解包 {code,data,message,success}，response.data 即为推荐房源对象
    recommendedHouse.value = response.data;
  } catch (error) {
    console.error('获取热门推荐失败:', error);
  } finally {
    loadingRecommendation.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadHouses(), fetchRecommendedHouse()]);
});

</script>

<style scoped lang="scss">
.filter-panel { padding: 20px 24px; }
.filter-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 14px; }
.filter-rows { border-top: 1px dashed var(--house-line); margin-top: 16px; padding-top: 6px; }
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
}
.filter-label {
  flex: 0 0 56px;
  line-height: 32px;
  margin-top: 4px;
  font-size: .875rem;
  font-weight: 600;
  color: var(--house-muted);
}
.filter-options { flex: 1 1 auto; min-width: 0; padding: 0; }
.filter-options--price { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; }
.filter-options--price :deep(.v-chip-group) { padding: 0; }
.filter-chip { font-size: .8125rem; height: 30px !important; padding: 0 12px; }
.price-custom { display: flex; align-items: center; gap: 8px; }
.price-input { width: 96px; flex: 0 0 96px; }
.price-input :deep(.v-field__input) { min-height: 32px; padding-top: 4px; padding-bottom: 4px; font-size: .8125rem; }
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--house-line);
}

.list-container { position: relative; }
.results-progress { position: absolute; top: -8px; left: 0; right: 0; z-index: 2; }

.house-card { overflow: hidden; cursor: pointer; }
.house-card__body { display: flex; gap: 20px; padding: 16px; }
.house-card__media { flex: 0 0 32%; max-width: 260px; }
.house-image { border-radius: 10px; }
.house-card__info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
.house-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--house-ink);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.house-card__meta { font-size: .9rem; color: var(--house-ink); }
.meta-dot { margin: 0 6px; color: var(--house-muted); }
.house-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.house-card__footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-top: 12px; }
.house-card__publisher { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.house-card__price { font-size: 1.5rem; line-height: 1; white-space: nowrap; }

.side-sticky { position: sticky; top: 80px; }
.rec-title { font-weight: 700; color: var(--house-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 959px) {
  .side-sticky { position: static; }
}
@media (max-width: 599px) {
  .filter-panel { padding: 16px; }
  .filter-row { flex-direction: column; gap: 0; }
  .filter-label { flex: none; line-height: 1.6; margin-top: 4px; }
  .filter-actions > .v-btn { flex: 1 1 0; }
  .house-card__body { flex-direction: column; gap: 12px; padding: 12px; }
  .house-card__media { flex: none; max-width: none; }
}
</style>
