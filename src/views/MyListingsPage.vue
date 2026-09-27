<script setup lang="ts">
import apiClient from "@/api/client";
import { useProfileStore } from "@/stores/profileStore";
import { ref, computed, reactive, onMounted, watch } from "vue";

interface HouseItem {
  id: number;
  title: string;
  area: number;
  available: number;
  block: string;
  community: string;
  decoration: string;
  direction: string;
  house_num: string;
  image_url: string;
  landlord: string;
  page_views: number | null;
  phone_num: string;
  price: number;
  publish_time: string;
  region: string;
  rent_type: string;
  rooms: string;
  ownership_status: 'pending' | 'verified' | 'rejected';
  subway: number;
  tag_new: number;
}

const profileStore = useProfileStore();

const loading = ref(false);
const houses = ref<HouseItem[]>([]);
const currentPage = ref(1);
const perPage = 10;
const searchQuery = ref("");

const landlordName = computed(() => profileStore.user?.name || "");

const statusMap = {
  pending: { text: "待核验", color: "warning" },
  verified: { text: "已核验", color: "success" },
  rejected: { text: "核验未通过", color: "error" },
};

const snackbar = reactive({
  show: false,
  message: "",
  color: "success",
});

/** Extract the actual data array from the API response, handling the interceptor unwrap. */
function extractDataArray(response: any): any[] {
  const body = response.data;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "data" in body) {
    return Array.isArray(body.data) ? body.data : [];
  }
  return [];
}

const fetchHouses = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get("/houses/landlord/me");
    houses.value = extractDataArray(response);
  } catch (error) {
    console.error("获取房源列表失败:", error);
    snackbar.show = true;
    snackbar.message = "获取房源列表失败";
    snackbar.color = "error";
  } finally {
    loading.value = false;
  }
};

const toggleAvailability = async (house: HouseItem) => {
  const newVal = house.available === 1 ? 0 : 1;
  try {
    await apiClient.put(`/houses/${house.id}`, { available: newVal });
    house.available = newVal;
    snackbar.show = true;
    snackbar.message = newVal ? "房源已上架" : "房源已下架";
    snackbar.color = "success";
  } catch (e) {
    console.error(e);
    snackbar.show = true;
    snackbar.color = "error";
    snackbar.message = "更新状态失败";
  }
};

const goToEdit = (houseId: number) => {
  snackbar.show = true;
  snackbar.message = `房源 ${houseId} 的编辑功能尚未开放`;
  snackbar.color = "info";
};

const goToCreate = () => {
  snackbar.show = true;
  snackbar.message = "新增房源功能尚未开放";
  snackbar.color = "info";
};

const formatPrice = (price: number) => {
  return price >= 10000 ? `${(price / 10000).toFixed(1)}万` : `${price}`;
};

const formatPublishTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return date.toLocaleDateString("zh-CN");
};

const filteredHouses = computed(() => {
  if (!searchQuery.value) return houses.value;
  const query = searchQuery.value.toLowerCase();
  return houses.value.filter(
    (house) =>
      (house.title ?? "").toLowerCase().includes(query) ||
      (house.community ?? "").toLowerCase().includes(query) ||
      (house.region ?? "").toLowerCase().includes(query) ||
      (house.block ?? "").toLowerCase().includes(query)
  );
});

const pagedHouses = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredHouses.value.slice(start, start + perPage);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredHouses.value.length / perPage)));
watch(searchQuery, () => { currentPage.value = 1; });
watch(totalPages, (pages) => { currentPage.value = Math.min(currentPage.value, pages); });
const listingStatus = (house: HouseItem) => statusMap[house.ownership_status] || statusMap.pending;

const statistics = computed(() => {
  const total = houses.value.length;
  const available = houses.value.filter((h) => h.available === 1).length;
  const unavailable = total - available;
  const totalViews = houses.value.reduce(
    (sum, h) => sum + (Number(h.page_views) || 0),
    0
  );
  return { total, available, unavailable, totalViews };
});

// Delete confirmation
const deleteDialog = ref(false);
const selectedHouse = ref<HouseItem | null>(null);

const confirmDelete = (house: HouseItem) => {
  selectedHouse.value = house;
  deleteDialog.value = true;
};

const doDelete = async () => {
  if (!selectedHouse.value?.id) return;
  try {
    await apiClient.delete(`/houses/${selectedHouse.value.id}`);
    snackbar.show = true;
    snackbar.message = "删除成功";
    snackbar.color = "success";
    deleteDialog.value = false;
    selectedHouse.value = null;
    await fetchHouses();
  } catch (error: any) {
    snackbar.show = true;
    snackbar.message =
      error?.response?.data?.message || error?.message || "删除失败";
    snackbar.color = "error";
  }
};

onMounted(() => {
  fetchHouses();
});
</script>

<template>
  <section class="listings-page">
    <!-- 标题 -->
    <div class="d-flex align-center flex-wrap ga-4 mb-5">
      <div class="flex-fill">
        <h2 class="house-section-title">我的房源</h2>
        <p class="house-muted text-body-2 mb-0">管理您发布的所有房源信息</p>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="goToCreate">发布新房源</v-btn>
    </div>

    <!-- 统计 -->
    <v-row class="mb-4" dense>
      <v-col v-for="stat in [
        { label: '总房源', value: statistics.total },
        { label: '已上架', value: statistics.available },
        { label: '已下架', value: statistics.unavailable },
        { label: '总浏览', value: statistics.totalViews },
      ]" :key="stat.label" cols="6" md="3">
        <v-card class="stat-card pa-4" elevation="0">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="house-muted text-body-2">{{ stat.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 工具栏 -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <h3 class="list-heading flex-fill">房源列表</h3>
      <v-text-field
        v-model="searchQuery"
        hide-details
        prepend-inner-icon="mdi-magnify"
        placeholder="搜索房源..."
        single-line
        density="compact"
        clearable
        class="listings-search"
      ></v-text-field>
      <v-btn
        icon="mdi-refresh"
        variant="tonal"
        color="primary"
        size="small"
        title="刷新"
        @click="fetchHouses"
        :loading="loading"
      ></v-btn>
    </div>

    <!-- 列表 -->
    <template v-if="loading">
      <v-card v-for="i in 3" :key="i" class="mb-3" elevation="0">
        <v-skeleton-loader type="list-item-avatar-three-line"></v-skeleton-loader>
      </v-card>
    </template>

    <v-card v-else-if="filteredHouses.length === 0" elevation="0">
      <div class="house-empty">
        <v-icon>mdi-home-off-outline</v-icon>
        <div>{{ searchQuery ? "没有找到符合条件的房源" : "暂无房源数据" }}</div>
        <v-btn color="primary" variant="tonal" class="mt-2" prepend-icon="mdi-plus" @click="goToCreate">
          发布新房源
        </v-btn>
      </div>
    </v-card>

    <template v-else>
      <v-card
        v-for="house in pagedHouses"
        :key="house.id"
        class="listing-card house-hover-lift mb-3 pa-4"
        elevation="0"
      >
        <div class="listing-row">
          <div class="listing-thumb" style="cursor: pointer" @click="goToEdit(house.id)">
            <v-img v-if="house.image_url" :src="house.image_url" cover height="100%" alt="房源图片">
              <template #error>
                <div class="thumb-fallback"><v-icon size="32" color="primary">mdi-home-outline</v-icon></div>
              </template>
            </v-img>
            <div v-else class="thumb-fallback"><v-icon size="32" color="primary">mdi-home-outline</v-icon></div>
          </div>

          <div class="listing-info">
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
              <h3 class="listing-title" style="cursor: pointer" @click="goToEdit(house.id)">{{ house.title }}</h3>
              <v-chip v-if="house.tag_new === 1" size="x-small" color="warning" variant="tonal">新</v-chip>
              <v-chip v-if="house.subway === 1" size="x-small" color="info" variant="tonal">近地铁</v-chip>
            </div>
            <div class="house-muted text-body-2 mb-1">
              <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>{{ house.region }}区 · {{ house.block }} · {{ house.community }}
            </div>
            <div class="house-muted text-body-2 mb-2">
              {{ house.rooms }} · {{ house.area }}㎡ · {{ house.direction }}向 · {{ house.rent_type }} · {{ house.decoration }}
            </div>
            <div class="d-flex align-center flex-wrap ga-2">
              <v-chip
                :color="house.available === 1 ? 'success' : 'error'"
                size="small"
                variant="tonal"
                :prepend-icon="house.available === 1 ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                title="点击切换上/下架"
                @click.stop="toggleAvailability(house)"
              >
                {{ house.available === 1 ? "已上架" : "已下架" }}
              </v-chip>
              <v-chip :color="listingStatus(house).color" size="small" variant="tonal">
                {{ listingStatus(house).text }}
              </v-chip>
              <span class="house-muted text-caption">
                <v-icon size="14">mdi-eye-outline</v-icon> {{ house.page_views || 0 }}
                <span class="mx-1">·</span>发布于 {{ formatPublishTime(house.publish_time) }}
              </span>
            </div>
          </div>

          <div class="listing-side">
            <div class="house-price text-h6">¥{{ formatPrice(house.price) }}<small>/月</small></div>
            <div class="d-flex ga-1">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                color="primary"
                @click.stop="goToEdit(house.id)"
                title="编辑"
              ></v-btn>
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                @click.stop="confirmDelete(house)"
                title="删除"
              ></v-btn>
            </div>
          </div>
        </div>
      </v-card>
    </template>

    <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        density="comfortable"
        @update:model-value="currentPage = $event"
      ></v-pagination>
    </div>

    <!-- 删除确认 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center pa-5 pb-2">
          <v-icon class="mr-2" color="error">mdi-alert-outline</v-icon>
          <span class="font-weight-bold">确认删除</span>
        </v-card-title>
        <v-card-text class="px-5">
          确定要删除房源
          <strong>{{ selectedHouse?.title }}</strong>
          吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </section>
</template>

<style scoped lang="scss">
.stat-card { background: var(--house-surface); }
.stat-value { color: var(--house-ink); font-size: 1.75rem; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.list-heading { color: var(--house-ink); font-size: 1.05rem; font-weight: 700; }
.listings-search { max-width: 300px; min-width: 200px; }
.listing-row { display: flex; align-items: center; gap: 16px; }
.listing-thumb {
  flex: 0 0 132px;
  width: 132px;
  height: 99px;
  border-radius: var(--house-radius);
  overflow: hidden;
  background: var(--house-soft);
}
.thumb-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--house-soft); }
.listing-info { flex: 1 1 auto; min-width: 0; }
.listing-title { color: var(--house-ink); font-size: 1.05rem; font-weight: 700; }
.listing-side { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

@media (max-width: 600px) {
  .listings-search { max-width: none; width: calc(100% - 52px); }
  .listing-row { flex-wrap: wrap; align-items: flex-start; }
  .listing-thumb { flex-basis: 100%; width: 100%; height: 160px; }
  .listing-side { width: 100%; flex-direction: row; align-items: center; justify-content: space-between; }
}
</style>
