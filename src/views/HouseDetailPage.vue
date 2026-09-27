<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { fetchHouseById, type HouseInfo } from "@/api/houseApi";
import apiClient from "@/api/client";
import HouseCard1 from "@/components/HouseDetail/HouseCard1.vue";
import Feature5 from "@/components/HouseDetail/Feature5.vue";
import HouseFacilities from "@/components/HouseDetail/HouseFacilities.vue";
import Map from "@/components/HouseDetail/Map.vue";

const route = useRoute();
const id = Number(route.params.id);
const loading = ref(true);
const errorMessage = ref("");
const house = ref<HouseInfo | null>(null);
const detail = ref({
  facilities: {
    tv: false,
    washer: false,
    wifi: false,
    refrigerator: false,
    bed: false,
    airconditioner: false,
  },
  map_coordinates: { lat: 30, lng: 120 },
  photos: [] as string[],
});

onMounted(async () => {
  if (!Number.isInteger(id) || id <= 0) {
    errorMessage.value = "房源编号无效";
    loading.value = false;
    return;
  }
  try {
    const [houseData, detailResponse] = await Promise.all([
      fetchHouseById(id),
      apiClient.get(`/houses/${id}/detail`).catch((error) => {
        if (error?.response?.status === 404) return null;
        throw error;
      }),
    ]);
    house.value = houseData;
    if (detailResponse?.data && typeof detailResponse.data === "object") {
      detail.value = {
        ...detail.value,
        ...detailResponse.data,
        facilities: { ...detail.value.facilities, ...(detailResponse.data.facilities || {}) },
        map_coordinates: { ...detail.value.map_coordinates, ...(detailResponse.data.map_coordinates || {}) },
        photos: Array.isArray(detailResponse.data.photos) ? detailResponse.data.photos : detail.value.photos,
      };
    }
    void apiClient.post(`/houses/${id}/increment-view`).catch((error) => {
      console.warn("浏览量上报失败，不影响房源详情展示", error);
    });
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.detail || "房源加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="detail-page">
    <v-skeleton-loader v-if="loading" type="image, article" />
    <v-alert v-else-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>
    <v-row v-else-if="house">
      <v-col cols="12">
        <HouseCard1 :house="house" :detail="detail" />
      </v-col>
      <v-col cols="12" md="5">
        <HouseFacilities :facilities="detail.facilities" />
      </v-col>
      <v-col cols="12" md="7">
        <Map :address="`湖南省长沙市${house.region || ''}${house.block || ''}${house.community || ''}`" />
      </v-col>
      <v-col cols="12">
        <Feature5 :house-id="id" />
      </v-col>
    </v-row>
  </div>
</template>
