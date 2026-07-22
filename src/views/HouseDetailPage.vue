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
    if (detailResponse?.data) detail.value = detailResponse.data;
    await apiClient.post(`/houses/${id}/increment-view`);
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.detail || "房源加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="detail-page pa-4 pa-md-7">
    <v-skeleton-loader v-if="loading" type="card, article" />
    <v-alert v-else-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>
    <v-row v-else-if="house" class="flex-0" dense>
      <v-col cols="12" xl="4">
        <HouseCard1 :house="house" :detail="detail" />
      </v-col>
      <v-col cols="12" xl="4">
        <HouseFacilities :facilities="detail.facilities" />
      </v-col>
      <v-col cols="12" xl="4">
        <Map :address="`湖南省长沙市${house.region || ''}${house.block || ''}${house.community || ''}`" />
      </v-col>
      <v-col cols="12">
        <Feature5 :house-id="id" />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.detail-page { max-width: 1440px; margin: 0 auto; }
</style>
