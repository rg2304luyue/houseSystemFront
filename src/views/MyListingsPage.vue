<script setup lang="ts">
import apiClient from "@/api/client";
import { useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profileStore";
import { ref, computed, reactive, onMounted } from "vue";

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
  status: number;
  subway: number;
  tag_new: number;
}

const router = useRouter();
const profileStore = useProfileStore();

const loading = ref(false);
const houses = ref<HouseItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref("");

const landlordName = computed(() => profileStore.user?.name || "");

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: "空置", color: "grey" },
  1: { text: "出租中", color: "green" },
  2: { text: "维修中", color: "orange" },
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
    totalPages.value = 1;
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
  router.push(`/houses/${houseId}/edit`);
};

const goToCreate = () => {
  router.push("/houses/new");
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

const statistics = computed(() => {
  const total = houses.value.length;
  const available = houses.value.filter((h) => h.available === 1).length;
  const unavailable = total - available;
  const totalViews = houses.value.reduce(
    (sum, h) => sum + (h.page_views || 0),
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
  <v-container>
    <v-row>
      <v-col cols="12">
        <!-- Header with statistics -->
        <v-card class="mb-5" elevation="2">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="6">
                <h1 class="text-h4 font-weight-bold">
                  <v-icon class="mr-2" size="large">mdi-home-group</v-icon>
                  我的房源
                </h1>
                <p class="text-subtitle-1 text-grey mt-1">
                  管理您发布的所有房源信息
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <v-row dense>
                  <v-col cols="6" sm="3">
                    <div class="text-center">
                      <div class="text-h5 font-weight-bold primary--text">
                        {{ statistics.total }}
                      </div>
                      <div class="text-caption">总房源</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="text-center">
                      <div class="text-h5 font-weight-bold success--text">
                        {{ statistics.available }}
                      </div>
                      <div class="text-caption">已上架</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="text-center">
                      <div class="text-h5 font-weight-bold error--text">
                        {{ statistics.unavailable }}
                      </div>
                      <div class="text-caption">已下架</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="text-center">
                      <div class="text-h5 font-weight-bold info--text">
                        {{ statistics.totalViews }}
                      </div>
                      <div class="text-caption">总浏览</div>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Main list card -->
        <v-card class="mx-auto" elevation="2">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>房源列表</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="searchQuery"
              hide-details
              prepend-inner-icon="mdi-magnify"
              placeholder="搜索房源..."
              single-line
              variant="solo"
              density="compact"
              clearable
              class="mr-2"
              style="max-width: 300px"
            ></v-text-field>
            <v-btn
              icon="mdi-refresh"
              @click="fetchHouses"
              :loading="loading"
            ></v-btn>
            <v-btn icon="mdi-plus" @click="goToCreate"></v-btn>
          </v-toolbar>

          <v-list select-strategy="leaf">
            <template v-if="loading">
              <v-skeleton-loader
                v-for="i in 3"
                :key="i"
                type="list-item-three-line"
                class="mx-auto"
              ></v-skeleton-loader>
            </template>

            <template v-else-if="filteredHouses.length === 0">
              <v-list-item>
                <div class="text-center py-10 w-100">
                  <v-icon size="64" color="grey">mdi-home-off</v-icon>
                  <p class="text-h6 text-grey mt-3">暂无房源数据</p>
                  <v-btn
                    color="primary"
                    class="mt-3"
                    @click="goToCreate"
                  >
                    <v-icon left>mdi-plus</v-icon>
                    发布新房源
                  </v-btn>
                </div>
              </v-list-item>
            </template>

            <template v-else>
              <v-list-item
                v-for="house in filteredHouses"
                :key="house.id"
                class="py-4 house-list-item"
              >
                <template v-slot:prepend>
                  <v-img
                    :src="
                      house.image_url ||
                      'https://via.placeholder.com/120x90?text=暂无图片'
                    "
                    width="120"
                    height="90"
                    cover
                    class="rounded mr-4"
                    @click="goToEdit(house.id)"
                    style="cursor: pointer"
                  ></v-img>
                </template>

                <v-list-item-title class="text-h6 mb-1">
                  <span
                    style="cursor: pointer"
                    @click="goToEdit(house.id)"
                  >{{ house.title }}</span>
                  <v-chip
                    v-if="house.tag_new === 1"
                    size="x-small"
                    color="error"
                    class="ml-2"
                  >
                    新
                  </v-chip>
                  <v-chip
                    v-if="house.subway === 1"
                    size="x-small"
                    color="info"
                    class="ml-1"
                  >
                    近地铁
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle
                  class="mb-1 text-high-emphasis opacity-100"
                >
                  <v-icon size="small">mdi-map-marker</v-icon>
                  {{ house.region }}区 · {{ house.block }} ·
                  {{ house.community }}
                  <span class="mx-2">|</span>
                  <v-icon size="small">mdi-home-variant</v-icon>
                  {{ house.rooms }} · {{ house.area }}㎡ ·
                  {{ house.direction }}向
                </v-list-item-subtitle>

                <v-list-item-subtitle class="text-high-emphasis">
                  <span class="text-h6 font-weight-bold error--text">
                    ¥{{ formatPrice(house.price) }}
                  </span>
                  <span class="text-caption ml-1">/月</span>
                  <span class="mx-2">|</span>
                  {{ house.rent_type }} · {{ house.decoration }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-list-item-action class="flex-column align-end">
                    <small class="mb-2 text-high-emphasis opacity-60">
                      发布于 {{ formatPublishTime(house.publish_time) }}
                    </small>
                    <div class="d-flex align-center">
                      <v-chip variant="outlined" class="mr-2" rounded="sm">
                        <v-icon size="small" start>mdi-eye</v-icon>
                        {{ house.page_views || 0 }}
                      </v-chip>
                      <v-chip
                        :color="
                          house.available === 1 ? 'success' : 'error'
                        "
                        variant="elevated"
                        @click.stop="toggleAvailability(house)"
                        rounded="sm"
                      >
                        <v-icon start>
                          {{
                            house.available === 1
                              ? "mdi-check-circle"
                              : "mdi-close-circle"
                          }}
                        </v-icon>
                        {{ house.available === 1 ? "已上架" : "已下架" }}
                      </v-chip>
                      <v-chip
                        :color="statusMap[house.status]?.color || 'grey'"
                        variant="elevated"
                        class="ml-1"
                        rounded="sm"
                      >
                        {{ statusMap[house.status]?.text || "未知" }}
                      </v-chip>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        color="primary"
                        class="ml-1"
                        @click.stop="goToEdit(house.id)"
                        title="编辑"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        class="ml-1"
                        @click.stop="confirmDelete(house)"
                        title="删除"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list>

          <v-divider></v-divider>
          <v-card-actions
            v-if="totalPages > 1"
            class="justify-center"
          >
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
              density="comfortable"
              @update:model-value="fetchHouses"
            ></v-pagination>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除房源
          <strong>{{ selectedHouse?.title }}</strong>
          吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="elevated" @click="doDelete">
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<style scoped lang="scss">
.house-list-item {
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(76, 175, 80, 0.08);
    transform: translateX(4px);
  }
}
</style>
