<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/api/client";
import { fetchHouseById, type HouseInfo } from "@/api/houseApi";

const route = useRoute();
const router = useRouter();
const house = ref<HouseInfo | null>(null);
const loading = ref(true);
const submitting = ref(false);
const contractId = ref<number | null>(null);
const errorMessage = ref("");
const purpose = ref("居住");
const agreed = ref(false);
const startDate = ref(new Date().toISOString().slice(0, 10));
const endDate = ref("");

const houseId = computed(() => Number(route.query.houseid));
const canSubmit = computed(
  () => house.value && agreed.value && startDate.value && endDate.value && startDate.value < endDate.value
);

onMounted(async () => {
  if (!Number.isInteger(houseId.value) || houseId.value <= 0) {
    errorMessage.value = "缺少有效的房源编号";
    loading.value = false;
    return;
  }
  try {
    house.value = await fetchHouseById(houseId.value);
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.detail || "房源加载失败";
  } finally {
    loading.value = false;
  }
});

async function ensureLease() {
  if (contractId.value) return contractId.value;
  if (!house.value) throw new Error("房源尚未加载");
  const leaseResponse = await apiClient.post("/leases", {
    house_id: house.value.id,
    rentValue: String(house.value.price),
    purpose: purpose.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
  contractId.value = Number(leaseResponse.data?.id);
  if (!contractId.value) throw new Error("后端未返回合同编号");
  return contractId.value;
}

async function submitLease(useMock = false) {
  if (!house.value || !canSubmit.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    const id = await ensureLease();

    if (useMock) {
      await apiClient.post(`/payments/${id}/mock-confirm`);
      await router.push("/RentHouse");
      return;
    }

    const paymentResponse = await apiClient.post("/payments/pay", {
      contract_id: id,
    });
    const payUrl = paymentResponse.data?.pay_url;
    if (!payUrl) throw new Error("后端未返回支付地址");
    window.location.assign(payUrl);
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail || error?.message || "签约失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <v-container class="py-8" style="max-width: 900px">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="router.back()">
      返回房源
    </v-btn>
    <v-card :loading="loading" elevation="4">
      <v-card-title class="text-h5 pa-6">房屋租赁签约</v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-5">
          {{ errorMessage }}
        </v-alert>
        <template v-if="house">
          <h2 class="text-h6 mb-2">{{ house.title }}</h2>
          <p class="text-medium-emphasis mb-5">
            {{ house.region }} {{ house.block }} {{ house.community }} · {{ house.rooms }} ·
            {{ house.area }}㎡
          </p>
          <v-alert type="info" variant="tonal" class="mb-5">
            月租 <strong>¥{{ house.price }}</strong>。租金与签约人身份将由服务器核验，无法在此修改。
          </v-alert>
          <v-text-field v-model="purpose" label="租赁用途" maxlength="50" />
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="startDate" type="date" label="起租日期" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="endDate" type="date" label="结束日期" />
            </v-col>
          </v-row>
          <v-checkbox v-model="agreed" label="我已阅读并同意房屋租赁约定" />
        </template>
      </v-card-text>
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          color="primary"
          size="large"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          @click="submitLease(false)"
        >
          创建合同并前往支付宝
        </v-btn>
        <v-btn
          color="secondary"
          size="large"
          variant="tonal"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          @click="submitLease(true)"
        >
          本地模拟支付
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
