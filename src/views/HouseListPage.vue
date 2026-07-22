<template>
<div class="pa-5">
  <v-container fluid class="pa-0">
    <v-card class="mb-5 pa-4" flat outlined>
      <v-card-title class="text-h5 font-weight-bold pl-0">
        智能搜索
      </v-card-title>
      <v-row align="center" dense>
        <v-col cols="12">
          <v-text-field
            v-model="searchFilters.community"
            label="请输入区域、商圈或小区名开始找房"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            @keyup.enter="applyFiltersAndResetPage"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-3">
        <v-col cols="auto" class="filter-label">按区域:</v-col>
        <v-col>
          <v-chip-group
            v-model="searchFilters.region"
            column
            multiple
            selected-class="text-primary"
          >
            <v-chip
              v-for="region in availableRegions"
              :key="region.value"
              :value="region.value"
              label
              size="small"
              filter
            >
              {{ region.text }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="auto" class="filter-label">方式:</v-col>
        <v-col>
          <v-chip-group
            v-model="searchFilters.rent_type"
            mandatory
            selected-class="text-primary"
          >
            <v-chip value="" label size="small" filter>不限</v-chip>
            <v-chip value="整租" label size="small" filter>整租</v-chip>
            <v-chip value="合租" label size="small" filter>合租</v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="auto" class="filter-label">租金:</v-col>
        <v-col>
          <v-chip-group
            v-model="selectedRentRange"
            selected-class="text-primary"
            @update:model-value="onRentRangeChange"
          >
            <v-chip value="all" label size="small" filter>不限</v-chip>
            <v-chip v-for="range in rentRanges" :key="range.label" :value="range.label" label size="small" filter>
              {{ range.label }}
            </v-chip>
          </v-chip-group>
        </v-col>
        <v-col cols="12" md="auto" class="d-flex align-center mt-2 mt-md-0 flex-wrap"> <v-text-field
            v-model.number="customMinPrice"
            label="最低价"
            variant="outlined"
            density="compact"
            type="number"
            hide-details
            class="mr-2"
            style="max-width: 100px;"
          ></v-text-field>
          <span class="mx-1 body-1">-</span>
          <v-text-field
            v-model.number="customMaxPrice"
            label="最高价"
            variant="outlined"
            density="compact"
            type="number"
            hide-details
            class="mr-2"
            style="max-width: 100px;"
          ></v-text-field>
          <v-btn  color="primary" variant="outlined" @click="applyCustomPriceRange" class="mt-2 mt-md-0">确定</v-btn>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="auto" class="filter-label">户型:</v-col>
        <v-col>
          <v-chip-group
            v-model="searchFilters.rooms"
            column
            multiple
            selected-class="text-primary"
          >
            <v-chip value="一居" label size="small" filter>一居</v-chip>
            <v-chip value="两居" label size="small" filter>两居</v-chip>
            <v-chip value="三居" label size="small" filter>三居</v-chip>
            <v-chip value="四居" label size="small" filter>四居</v-chip>
            <v-chip value="四居+" label size="small" filter>四居+</v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
      
      <v-row dense align="center" class="mt-2">
        <v-col cols="auto" class="filter-label">朝向:</v-col>
        <v-col>
          <v-chip-group
            v-model="searchFilters.orientation"
            column
            multiple
            selected-class="text-primary"
          >
            <v-chip v-for="o in orientations" :key="o" :value="o" label size="small" filter>{{ o }}</v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-row dense class="mt-4">
        <v-col>
          <v-btn color="primary" @click="applyFiltersAndResetPage" :loading="loading">
            <v-icon start>mdi-filter-variant</v-icon>
            应用筛选
          </v-btn>
          <v-btn class="ml-2" @click="resetFilters" :disabled="loading">
            <v-icon start>mdi-refresh</v-icon>
            重置
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <div class="list-container pa-0 pt-5">
      <v-progress-linear
        v-if="loading && hasLoaded"
        indeterminate
        color="primary"
        class="results-progress"
      ></v-progress-linear>

      <div v-if="loading && !hasLoaded" class="text-center my-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-3 text-grey-darken-1">正在加载房源数据...</p>
      </div>

      <v-row v-else-if="houses.length > 0" dense>
        <v-col cols="12" md="8">
          <v-card 
            v-for="house in houses" 
            :key="house.id" 
            class="mb-4 house-card"
            hover
            @click="goToHouseDetail(house.id)"
          >
            <v-row no-gutters>
              <v-col cols="12" sm="4" class="d-flex align-center pa-sm-3 pa-2">
                <v-img
                  cover
                  :src="house.image_url || 'https://cdn.vuetifyjs.com/images/cards/docks.jpg'" 
                  aspect-ratio="1.33" rounded="sm"
                  class="house-image"
                ></v-img>
              </v-col>

              <v-col cols="12" sm="8" class="d-flex flex-column justify-space-between pa-3">
                <div>
                  <v-card-title class="pa-0 mb-1 text-h6 font-weight-bold house-title-clamp">
                    {{ house.title }}
                  </v-card-title>
                  
                  <v-card-subtitle class="pa-0 mb-2 text-body-2 text-grey-darken-1">
                    {{ house.community }} {{ house.block ? `- ${house.block}` : '' }}
                  </v-card-subtitle>

                  <div class="text-body-2 text-grey-darken-2 mb-2">
                    <span>{{ house.rooms }}</span>
                    <span class="mx-1">|</span>
                    <span>{{ house.area }}m²</span> <span class="mx-1">|</span>
                    <span>{{ house.direction }}</span>
                    <span class="mx-1">|</span>
                    <span>{{ house.decoration || '简装' }}</span> </div>
                
                  <div class="mb-2">
                    <v-chip v-if="house.subway === 1" color="blue" text-color="blue-darken-2" size="small" label class="mr-1 mb-1">近地铁</v-chip>
                    <v-chip v-if="house.tag_new === 1" color="orange" text-color="orange-darken-2" size="small" label class="mr-1 mb-1">新上房源</v-chip>
                    <v-chip v-if="house.available === 1" color="primary" text-color="green-darken-2" size="small" label class="mr-1 mb-1">随时可看</v-chip>
                    <v-chip color="green" text-color="cyan-darken-2" size="small" label class="mr-1 mb-1">{{ house.rent_type }}</v-chip>
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center mt-auto pt-2">
                  <div class="text-caption text-grey-darken-1">
                    <v-icon size="small" start>mdi-account-circle-outline</v-icon>
                    <span>{{ house.landlord || '个人房源' }}</span> <span class="mx-2 VPublishInfoDivider">/</span>
                    <v-icon size="small" start>mdi-clock-time-eight-outline</v-icon>
                    <span>{{ formatPublishTime(house.publish_time) }}</span>
                  </div>
                  <div class="text-h5 font-weight-bold" style="color: #FA5741;">
                    {{ house.price }} <span class="text-subtitle-2">元/月</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card>
           <v-pagination
            v-if="pagination.pages > 1"
            v-model="pagination.page"
            :length="pagination.pages"
            
            class="mt-5"
            density="compact"
          ></v-pagination>
        </v-col>

        <v-col cols="12" md="4">
                    <v-card
                      class="mx-auto recommendation-card"
                      prepend-icon="mdi-star-circle-outline"
                      width="100%"
                      elevation="2"
                    >
                      <template v-slot:title>
                        <span class="font-weight-black text-primary">热门推荐</span>
                      </template>
                      
                      <v-card-subtitle class="text-caption">周边好房不容错过</v-card-subtitle>
                      
                      <v-card-text class="bg-surface-light pt-4 pb-2">
                        <template v-if="loadingRecommendation">
                          <v-skeleton-loader type="article"></v-skeleton-loader>
                        </template>
                        
                        <template v-else-if="recommendedHouse">
                          <v-row class="mb-2">
                            <v-chip variant="outlined" color="primary" size="small" class="mr-2">
                              {{ recommendedHouse.rent_type || '整租' }}
                            </v-chip>
                            <span class="text-subtitle-1 font-weight-medium">
                              {{ recommendedHouse.title.split(' ')[0] || '尚鑫海悦' }}
                            </span>
                          </v-row>
                          
                          <v-row class="mb-3">
                            <div class="d-flex align-center">
                              <v-icon icon="mdi-floor-plan" size="small" class="mr-1"></v-icon>
                              <span class="text-caption">{{ recommendedHouse.rooms || '1室0厅' }}</span>
                              
                              <v-icon 
                                v-if="recommendedHouse.direction"
                                icon="mdi-compass" 
                                size="small" 
                                class="ml-3 mr-1"
                              ></v-icon>
                              <span class="text-caption" v-if="recommendedHouse.direction">
                                {{ recommendedHouse.direction }}
                              </span>
                            </div>
                          </v-row>
                          
                          <v-row class="mb-2">
                            <v-chip v-if="recommendedHouse.decoration" size="small" class="mr-1">
                              {{ recommendedHouse.decoration }}
                            </v-chip>
                            <v-chip 
                              v-if="recommendedHouse.area" 
                              size="small" 
                              variant="outlined"
                            >
                              {{ recommendedHouse.area }}m²
                            </v-chip>
                          </v-row>
                          
                          <v-row class="align-center">
                            <span class="text-h6 text-primary font-weight-bold">
                              {{ recommendedHouse.price }}<span class="text-subtitle-2">元/月</span>
                            </span>
                            
                            <v-spacer></v-spacer>
                            
                            <div class="d-flex align-center">
                              <v-avatar color="primary" size="32">
                                <v-icon icon="mdi-account" size="small"></v-icon>
                              </v-avatar>
                              <span class="text-caption ml-2">
                                {{ recommendedHouse.landlord || '个人房源' }}
                              </span>
                            </div>
                          </v-row>
                        </template>
                        
                        <template v-else>
                          <v-alert type="info" variant="tonal" class="my-2">
                            暂无热门推荐
                          </v-alert>
                        </template>
                      </v-card-text>
                      
                      <v-divider class="my-2"></v-divider>

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
        </v-col>
      </v-row>
      
      <v-row v-else-if="!loading && houses.length === 0" dense>
          <v-col cols="12" class="text-center py-10">
            <v-icon size="70" color="grey-lighten-1">mdi-home-alert-outline</v-icon>
            <p class="mt-4 text-h6 text-grey-darken-1">抱歉，没有找到符合条件的房源</p>
            <p class="text-grey">请尝试调整您的筛选条件或稍后再试。</p>
          </v-col>
      </v-row>
    </div>  
  </v-container>
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

    // Note: Boolean filters like 'subway' or 'available' are not in current searchFilters
    // If you add them, ensure they are converted to 0/1 if backend expects numbers.

    const response = await fetchHouses(apiParams);
    if (requestId !== latestRequestId) return;

    houses.value = response.items;
    pagination.total = response.total;
    pagination.pages = response.pages;
    pagination.per_page = response.per_page;

  } catch (error) {
    if (requestId !== latestRequestId) return;
    console.error("Failed to load houses in component:", error);
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
  console.log("Houses data after initial load:", houses.value);
});

</script>

<style scoped>
.filter-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65); /* Slightly darker for better contrast */
  margin-right: 8px;
  white-space: nowrap;
  align-self: center; /* Align with chips vertically */
}

.v-chip-group .v-chip {
  margin: 4px !important; /* ensure spacing */
}

.house-card {
  border: 1px solid #e0e0e0; /* Subtle border */
}
.house-card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.12) !important;
  transform: translateY(-3px);
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
}
.list-container {
  position: relative;
}
.results-progress {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  z-index: 2;
}
.recommendation-card {
  border: 1px solid #e0e0e0;
}
</style>

<style scoped lang="scss">
// Scoped SCSS can go here if needed, original styles were mostly CSS
.house-image {
  border: 1px solid var(--house-line);
  transition: transform .35s ease;
}
.house-card { border-radius: 16px; overflow: hidden; transition: transform .22s ease, box-shadow .22s ease; }
.house-card:hover { transform: translateY(-3px); box-shadow: 0 18px 34px rgba(23, 63, 58, .12) !important; }
.house-card:hover .house-image { transform: scale(1.025); }
.house-title-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 1; 
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4; /* Adjust for desired spacing */
  // min-height: calc(1.25rem * 1.4); /* text-h6 font-size (1.25rem default) * line-height */
  // The above min-height might be too specific, Vuetify usually handles heights.
}

// Responsive custom price input area
@media (max-width: 959px) { // Vuetify's 'md' breakpoint
  .d-flex.align-center.flex-wrap .v-text-field {
    max-width: calc(50% - 20px) !important; /* Adjust for spacing */
    flex-basis: calc(50% - 20px) !important;
  }
  .d-flex.align-center.flex-wrap .v-btn {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
