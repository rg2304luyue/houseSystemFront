<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profileStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import apiClient from "@/api/client";
import dayjs from "dayjs";
import { formatFileSize } from "@/utils/common";
import AnimationUpload from "@/components/house/AnimationUpload.vue";

const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();

const houseId = computed(() => {
  const id = route.params.id;
  return id ? Number(id) : null;
});
const isEdit = computed(() => !!houseId.value);

const pageTitle = computed(() =>
  isEdit.value ? "编辑房源信息" : "发布房源"
);
const submitLabel = computed(() =>
  isEdit.value ? "更新房源" : "上传房源"
);

// Profile
const user = reactive({ ...profileStore.user });

// Feature cards (create mode only)
const features = ref([
  {
    image:
      "https://d214hhm15p4t1d.cloudfront.net/nzr/3506522640180f883a58a6849beb1d2463794133/img/comprehensiveListings.d279ced0.svg",
    title: "综合房源浏览",
    description: "我们致力于为您的房源提供优质的服务",
  },
  {
    image:
      "https://d214hhm15p4t1d.cloudfront.net/nzr/3506522640180f883a58a6849beb1d2463794133/img/usefulResources.d2e569af.svg",
    title: "丰富的数据管理",
    description:
      "选择我们的租房平台，动态查看您的租房数据和账目，轻松管理您的租房信息。",
  },
  {
    image:
      "https://d214hhm15p4t1d.cloudfront.net/nzr/3506522640180f883a58a6849beb1d2463794133/img/peaceOfMind.cfc8536a.svg",
    title: "心旷神怡",
    description: "一站式租房服务，让您轻松上传房源，快速找到合适的租客。",
  },
]);

// Form data
const house_info = ref({
  title: "",
  community: "",
  price: 0,
  decoration: "精装",
  available: 1,
  subway: 0,
  direction: "南",
  area: 0,
  block: "",
  region: "岳麓",
  rent_type: "整租",
  house_num: "",
  rooms: "",
  tag_new: 0,
  phone_num: "",
  landlord: "",
  image_url: "",
  publish_time: "",
});

const house_detail = ref<{
  facilities: Record<string, boolean>;
  map_coordinates: { lat: number; lng: number };
  photos: string[];
}>({
  facilities: {
    tv: false,
    washer: false,
    wifi: false,
    refrigerator: false,
    bed: false,
    airconditioner: false,
  },
  map_coordinates: { lat: 30.0, lng: 120.0 },
  photos: [],
});

// Options
const decorationTypes = ref(["毛坯", "简装", "精装"]);
const orientations = ref([
  "东", "南", "西", "北", "南北", "东西", "东北", "西北", "东南", "西南",
]);
const availableRegions = ref([
  { text: "岳麓", value: "岳麓" },
  { text: "雨花", value: "雨花" },
  { text: "天心", value: "天心" },
  { text: "芙蓉", value: "芙蓉" },
  { text: "望城", value: "望城" },
  { text: "长沙县", value: "长沙县" },
]);
const rentTypes = ref(["整租", "合租"]);

const allAmenities = ref([
  { key: "tv", label: "电视", icon: "material-symbols:tv-outline-rounded" },
  { key: "washer", label: "洗衣机", icon: "material-symbols:local-laundry-service-outline-sharp" },
  { key: "airconditioner", label: "空调", icon: "material-symbols:ac-unit-outline" },
  { key: "wardrobe", label: "衣柜", icon: "material-symbols:dresser-outline" },
  { key: "refrigerator", label: "冰箱", icon: "material-symbols:kitchen-outline-rounded" },
  { key: "waterheater", label: "热水器", icon: "material-symbols:water-heater-outline" },
  { key: "bed", label: "床", icon: "material-symbols:bed-outline" },
  { key: "heating", label: "暖气", icon: "material-symbols:radiator-outline" },
  { key: "wifi", label: "宽带", icon: "material-symbols:wifi-rounded" },
  { key: "naturalgas", label: "天然气", icon: "material-symbols:outdoor-grill-outline" },
]);
const selectedAmenityKeys = ref<string[]>([]);

const updateSelectedKeysFromFacilities = () => {
  const keys: string[] = [];
  if (house_detail.value.facilities) {
    for (const key in house_detail.value.facilities) {
      if (house_detail.value.facilities[key] === true) {
        keys.push(key);
      }
    }
  }
  selectedAmenityKeys.value = keys;
};

// Image handling
const filesFromInput = ref<File[]>([]);
const allProcessedFileInfos = ref<any[]>([]);
const allRawFiles = ref<File[]>([]);

const processNewFiles = async (newlySelectedFiles: File[]) => {
  if (!newlySelectedFiles || newlySelectedFiles.length === 0) return;
  const newFilePromises: Promise<any>[] = [];
  for (const file of newlySelectedFiles) {
    const isDuplicate = allRawFiles.value.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (isDuplicate) continue;
    allRawFiles.value.push(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const filePromise = new Promise((resolve) => {
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          resolve({
            key: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: formatFileSize(file.size),
            imageSize: `${img.width}x${img.height}`,
            type: file.type,
            suffix: file.name.split(".").pop() || "",
            lastModifiedDate: dayjs(file.lastModified).format("YYYY-MM-DD HH:mm:ss"),
            link: reader.result,
            rawFile: file,
            previewEnabled: true,
          });
        };
        img.onerror = () => {
          resolve({
            key: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}-error`,
            name: file.name,
            size: formatFileSize(file.size),
            imageSize: "N/A",
            type: file.type,
            suffix: file.name.split(".").pop() || "",
            lastModifiedDate: dayjs(file.lastModified).format("YYYY-MM-DD HH:mm:ss"),
            link: null,
            rawFile: file,
            previewEnabled: false,
          });
        };
      };
    });
    newFilePromises.push(filePromise);
  }
  const newInfos = await Promise.all(newFilePromises);
  allProcessedFileInfos.value.push(...newInfos.filter((info) => info !== null));
};

const removeImage = (fileInfoToRemove: any) => {
  allProcessedFileInfos.value = allProcessedFileInfos.value.filter(
    (i) => i.key !== fileInfoToRemove.key
  );
  allRawFiles.value = allRawFiles.value.filter(
    (f) => f.name !== fileInfoToRemove.name || f.lastModified !== fileInfoToRemove.rawFile.lastModified
  );
};

const clearFiles = () => {
  filesFromInput.value = [];
  allProcessedFileInfos.value = [];
  allRawFiles.value = [];
};

// Validation helper
const requiredRule = (v: any) =>
  v !== undefined && v !== null && v !== "" ? true : "此项为必填项";

// Fetch existing data for edit mode
const pageLoading = ref(false);
const detailExists = ref(false);

const fetchExistingHouse = async () => {
  if (!isEdit.value || !houseId.value) return;
  pageLoading.value = true;
  try {
    const { data: infoData } = await apiClient.get(`/houses/${houseId.value}`);
    house_info.value = {
      title: infoData.title || "",
      community: infoData.community || "",
      price: infoData.price || 0,
      decoration: infoData.decoration || "精装",
      available: infoData.available ?? 1,
      subway: infoData.subway ?? 0,
      direction: infoData.direction || "南",
      area: infoData.area || 0,
      block: infoData.block || "",
      region: infoData.region || "岳麓",
      rent_type: infoData.rent_type || "整租",
      house_num: infoData.house_num || "",
      rooms: infoData.rooms || "",
      tag_new: infoData.tag_new ?? 0,
      phone_num: infoData.phone_num || infoData.contact_phone || "",
      landlord: infoData.landlord || infoData.contact_person || "",
      image_url: infoData.image_url || "",
      publish_time: infoData.publish_time || "",
    };

    // Try to fetch detail
    try {
      const { data: detailData } = await apiClient.get(
        `/houses/${houseId.value}/detail`
      );
      house_detail.value = {
        facilities: detailData.facilities || {
          tv: false, washer: false, wifi: false, refrigerator: false,
          bed: false, airconditioner: false,
        },
        map_coordinates: detailData.map_coordinates || { lat: 30.0, lng: 120.0 },
        photos: detailData.photos || [],
      };
      detailExists.value = true;
      updateSelectedKeysFromFacilities();
    } catch {
      detailExists.value = false;
    }
  } catch (e) {
    snackbarStore.showErrorMessage("获取房源信息失败");
  } finally {
    pageLoading.value = false;
  }
};

// Submit
const isSubmitting = ref(false);

const submitHouse = async () => {
  isSubmitting.value = true;

  if (allRawFiles.value.length > 0) {
    snackbarStore.showErrorMessage(
      "当前后端未提供图片上传接口，请移除选择的图片后再提交。"
    );
    isSubmitting.value = false;
    return;
  }

  const toNumber = (value: unknown, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const toNullableInteger = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  };

  const payload: Record<string, any> = {
    ...house_info.value,
    price: toNumber(house_info.value.price),
    area: toNumber(house_info.value.area),
    available: toNumber(house_info.value.available),
    subway: toNumber(house_info.value.subway),
    tag_new: toNumber(house_info.value.tag_new),
    house_num: toNullableInteger(house_info.value.house_num),
    landlord: user.name || house_info.value.landlord,
    phone_num: user.phone || house_info.value.phone_num,
  };

  // Build facilities
  const facilitiesObject: Record<string, boolean> = {};
  allAmenities.value.forEach((amenity) => {
    facilitiesObject[amenity.key] =
      selectedAmenityKeys.value.includes(amenity.key);
  });

  const detailPayload = {
    facilities: facilitiesObject,
    map_coordinates: house_detail.value.map_coordinates,
    photos: house_detail.value.photos || [],
  };

  try {
    if (isEdit.value && houseId.value) {
      // Update
      await apiClient.put(`/houses/${houseId.value}`, payload);
      if (detailExists.value) {
        await apiClient.put(`/houses/${houseId.value}/detail`, detailPayload);
      } else {
        await apiClient.post(`/houses/${houseId.value}/detail`, detailPayload);
        detailExists.value = true;
      }
      snackbarStore.showSuccessMessage("房源更新成功");
    } else {
      // Create
      const res = await apiClient.post("/houses/", payload);
      // apiClient interceptor unwraps {code, data} -> response.data is the created object
      const created =
        res.data && typeof res.data === "object" ? res.data : null;
      const newId = created?.id;
      if (!newId) {
        throw new Error("房源创建成功但服务端未返回房源编号");
      }
      await apiClient.post(`/houses/${newId}/detail`, detailPayload);
      snackbarStore.showSuccessMessage("房源创建成功");
    }
    setTimeout(() => {
      router.push("/my-listings");
    }, 1500);
  } catch (error: any) {
    snackbarStore.showErrorMessage(
      error?.response?.data?.message ||
        error?.message ||
        "操作失败，请重试"
    );
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  if (isEdit.value) {
    await fetchExistingHouse();
  }
});

watch(
  () => house_detail.value.facilities,
  () => {
    updateSelectedKeysFromFacilities();
  },
  { deep: true }
);
</script>

<template>
  <v-container>
    <v-row class="mb-5">
      <!-- Header banner -->
      <v-col cols="12" md="12" lg="12">
        <v-sheet color="white" class="py-10 text-center">
          <h1 class="text-h4 font-weight-bold header-title mb-3">
            {{ pageTitle }}
          </h1>
          <p
            class="text-subtitle-1 header-subtitle mx-auto"
            style="max-width: 600px"
          >
            数万线下门店 · 快速全域推广 · 专业经纪人服务
          </p>
          <!-- Feature cards (create mode only) -->
          <v-container v-if="!isEdit">
            <v-row justify="center">
              <v-col
                v-for="(feature, i) in features"
                :key="i"
                cols="12"
                sm="6"
                md="4"
                class="text-center pa-4 d-flex flex-column align-center"
              >
                <div class="mb-5" style="position: relative">
                  <v-img
                    :src="feature.image"
                    :alt="feature.title"
                    height="120px"
                    width="auto"
                    contain
                  >
                    <v-icon
                      color="yellow-darken-2"
                      style="position: absolute; top: 0; left: 0; font-size: 16px"
                    >
                      mdi-star-four-points
                    </v-icon>
                  </v-img>
                </div>
                <h3
                  class="text-h6 font-weight-bold mb-3"
                  style="color: #2c3e50"
                >
                  {{ feature.title }}
                </h3>
                <p
                  class="text-body-2 text-medium-emphasis mx-auto"
                  style="max-width: 320px; line-height: 1.7"
                >
                  {{ feature.description }}
                </p>
              </v-col>
            </v-row>
          </v-container>
        </v-sheet>
      </v-col>

      <!-- Loading state -->
      <v-col v-if="pageLoading" cols="12" class="text-center py-10">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
      </v-col>

      <!-- Form -->
      <v-col v-else cols="12" md="12">
        <v-card class="mb-5">
          <v-card-title class="py-4 font-weight-bold">
            房屋基本信息
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-7">
            <v-row>
              <v-col cols="12" sm="6">
                <v-label class="font-weight-medium mb-2">房屋标题</v-label>
                <v-text-field
                  v-model="house_info.title"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="房屋标题"
                  hide-details
                  :rules="[requiredRule]"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">房屋小区</v-label>
                <v-text-field
                  v-model="house_info.community"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="小区"
                  hide-details
                  :rules="[requiredRule]"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">价格/月</v-label>
                <v-text-field
                  class="bg-red-lighten-5"
                  v-model.number="house_info.price"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  type="number"
                  placeholder="房屋价格"
                  hide-details
                  :rules="[requiredRule]"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-chip-group
                  v-model="house_info.decoration"
                  selected-class="text-primary"
                  mandatory
                  filter
                >
                  <v-chip
                    v-for="deco in decorationTypes"
                    :key="deco"
                    :value="deco"
                    rounded="sm"
                    class="mr-2 mb-2"
                  >
                    {{ deco }}
                  </v-chip>
                </v-chip-group>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="house_info.available"
                  :items="[
                    { title: '是', value: 1 },
                    { title: '否', value: 0 },
                  ]"
                  label="是否随时看房"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  color="primary"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="house_info.subway"
                  :items="[
                    { title: '是', value: 1 },
                    { title: '否', value: 0 },
                  ]"
                  label="是否近地铁"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  color="primary"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="house_info.direction"
                  label="房屋朝向"
                  :items="orientations"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="选择朝向"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">面积 (㎡)</v-label>
                <v-text-field
                  v-model.number="house_info.area"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  type="number"
                  placeholder="房屋面积"
                  suffix="㎡"
                  hide-details
                  min="0"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">楼栋/期</v-label>
                <v-text-field
                  v-model="house_info.block"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="例如 A栋 / 一期"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">所在区域</v-label>
                <v-select
                  v-model="house_info.region"
                  :items="availableRegions"
                  item-title="text"
                  item-value="value"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="选择区域"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-label class="font-weight-medium mb-2">租赁方式</v-label>
                <v-chip-group
                  v-model="house_info.rent_type"
                  selected-class="text-primary"
                  mandatory
                  filter
                >
                  <v-chip
                    v-for="rt in rentTypes"
                    :key="rt"
                    :value="rt"
                    rounded="sm"
                    class="mr-2 mb-2"
                  >
                    {{ rt }}
                  </v-chip>
                </v-chip-group>
              </v-col>
              <v-col cols="12" sm="6">
                <v-label class="font-weight-medium mb-2">户型</v-label>
                <v-text-field
                  v-model="house_info.rooms"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="如：2室1厅1卫"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-label class="font-weight-medium mb-2">房源编号</v-label>
                <v-text-field
                  v-model="house_info.house_num"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  placeholder="房源编号"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="house_info.tag_new"
                  :items="[
                    { title: '是', value: 1 },
                    { title: '否', value: 0 },
                  ]"
                  label="新上标签"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  color="primary"
                />
              </v-col>
              <v-col cols="12" sm="12">
                <v-label class="font-weight-medium mb-2">房屋设施（可多选）</v-label>
                <v-select
                  v-model="selectedAmenityKeys"
                  :items="allAmenities"
                  item-title="label"
                  item-value="key"
                  label="选择设施"
                  multiple
                  chips
                  closable-chips
                  clearable
                  variant="outlined"
                  density="compact"
                  placeholder="请选择房屋设施"
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :prepend-icon="item.raw.icon"
                      :text="item.raw.label"
                    ></v-chip>
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="undefined">
                      <template v-slot:prepend>
                        <v-icon :icon="item.raw.icon" class="mr-3"></v-icon>
                      </template>
                      <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-5">
            <v-spacer></v-spacer>
            <v-btn
              class="px-5"
              @click="submitHouse"
              color="primary"
              elevation="1"
              variant="elevated"
              size="x-large"
              :loading="isSubmitting"
            >
              {{ submitLabel }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Image upload area -->
      <v-col cols="12">
        <v-file-input
          v-model="filesFromInput"
          @update:modelValue="processNewFiles(filesFromInput)"
          color="primary"
          counter
          label="选择房源详情图片"
          accept="image/png, image/jpeg, image/bmp, image/webp"
          multiple
          placeholder="点击选择或拖拽图片到此处"
          prepend-icon="mdi-image-multiple-outline"
          variant="solo"
          @click:clear="clearFiles"
          :show-size="1000"
        >
          <template v-slot:selection="{ fileNames }">
            <template v-if="fileNames.length > 0">
              <template
                v-for="(fileName, index) in fileNames.slice(0, 3)"
                :key="fileName"
              >
                <v-chip color="primary" label size="small" class="me-2">
                  {{ fileName }}
                </v-chip>
              </template>
              <span
                v-if="fileNames.length > 3"
                class="text-overline text-grey-darken-3 mx-2"
              >
                +{{ fileNames.length - 3 }} 个文件
              </span>
            </template>
            <span
              v-else-if="
                allRawFiles.length > 0 && filesFromInput.length === 0
              "
              class="text-subtitle-2 text-grey-darken-1"
            >
              已添加 {{ allRawFiles.length }} 个文件。可继续选择或清空。
            </span>
            <span v-else class="text-subtitle-2 text-grey-darken-1">
              未选择文件
            </span>
          </template>
        </v-file-input>
      </v-col>
    </v-row>

    <!-- Image preview area -->
    <v-sheet
      v-if="allProcessedFileInfos.length === 0"
      class="d-flex align-center justify-center text-center"
      min-height="60vh"
      rounded="lg"
      border
    >
      <div>
        <AnimationUpload :size="250" />
        <h3
          class="text-h5 text-md-h4 font-weight-bold text-blue-grey-darken-1 mt-6"
        >
          {{ isEdit ? "更新您的房源详情图片" : "上传您的房源详情图片" }}
        </h3>
        <p class="text-body-1 text-blue-grey-lighten-1 mt-2">
          支持多张图片同时预览和上传，默认第一张是封面
        </p>
      </div>
    </v-sheet>

    <v-sheet v-else rounded="lg" border>
      <perfect-scrollbar class="view pa-3 pa-md-5">
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
            lg="3"
            v-for="fileInfo in allProcessedFileInfos"
            :key="fileInfo.key"
          >
            <v-card elevation="2" class="fill-height d-flex flex-column">
              <v-img
                height="200"
                :src="fileInfo.link"
                cover
                class="align-end text-white"
              >
                <v-card-title class="d-flex justify-end pa-1">
                  <v-btn
                    icon
                    density="comfortable"
                    color="error"
                    variant="elevated"
                    @click="removeImage(fileInfo)"
                  >
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top"
                      >移除图片</v-tooltip
                    >
                  </v-btn>
                </v-card-title>
              </v-img>
              <v-divider></v-divider>
              <div class="d-flex flex-column pa-3 flex-grow-1">
                <h5
                  class="text-subtitle-1 font-weight-bold text-truncate"
                  :title="fileInfo.name"
                >
                  {{ fileInfo.name }}
                </h5>
                <h6 class="text-caption text-grey-darken-1">
                  {{ fileInfo.suffix?.toUpperCase() }} {{ fileInfo.imageSize }}
                </h6>
                <v-spacer></v-spacer>
                <div class="mt-2">
                  <v-chip
                    color="primary"
                    size="small"
                    label
                    variant="tonal"
                  >
                    {{ fileInfo.type }}
                  </v-chip>
                  <v-chip
                    color="secondary"
                    size="small"
                    label
                    variant="tonal"
                    class="ms-1"
                  >
                    {{ fileInfo.size }}
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </perfect-scrollbar>
    </v-sheet>
  </v-container>
</template>

<style scoped lang="scss">
.view {
  // scrollable content
}

.v-card.fill-height {
  display: flex;
  flex-direction: column;
}
</style>
