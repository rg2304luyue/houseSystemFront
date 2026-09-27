<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
const localDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};
const startDate = ref(localDate());
const endDate = ref("");
interface PendingLease {
  id: number;
  houseId: number;
  purpose: string;
  startDate: string;
  endDate: string;
  rentValue: string;
}
const pendingLeases = ref<PendingLease[]>([]);

const houseId = computed(() => Number(route.query.houseid));
const canSubmit = computed(
  () => Boolean(contractId.value) || (house.value?.can_sign && agreed.value && startDate.value && endDate.value && startDate.value < endDate.value)
);

async function loadContracts() {
  loading.value = true;
  errorMessage.value = "";
  contractId.value = null;
  house.value = null;
  try {
    const response = await apiClient.get("/leases/pending");
    pendingLeases.value = response.data;
    if (!Number.isInteger(houseId.value) || houseId.value <= 0) return;
    const pending = pendingLeases.value.find((lease) => lease.houseId === houseId.value);
    if (pending) {
      contractId.value = pending.id;
      purpose.value = pending.purpose;
      startDate.value = pending.startDate;
      endDate.value = pending.endDate;
      agreed.value = true;
    }
    house.value = await fetchHouseById(houseId.value);
    if (!house.value.can_sign && !contractId.value) {
      errorMessage.value = house.value.unavailable_reason || "该房源当前不能在线签约";
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.detail || "房源加载失败";
  } finally {
    loading.value = false;
  }
}
watch(houseId, loadContracts, { immediate: true });

async function cancelLease(id: number) {
  submitting.value = true;
  try {
    await apiClient.post(`/payments/${id}/cancel`);
    await loadContracts();
  } catch (error: any) {
    errorMessage.value = error?.message || "取消合同失败，请重试";
  } finally {
    submitting.value = false;
  }
}

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
  <section class="contract-page">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="router.back()">
      {{ houseId ? '返回房源' : '返回' }}
    </v-btn>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-5">
      {{ errorMessage }}
    </v-alert>

    <!-- 待支付合同列表 -->
    <template v-if="!houseId">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
        <div>
          <h2 class="house-section-title">我的待支付合同</h2>
          <p class="house-muted text-body-2 mb-0">未完成支付的合同会保留在这里，可继续支付或取消。</p>
        </div>
        <v-chip v-if="pendingLeases.length" color="warning" size="small" variant="tonal">
          {{ pendingLeases.length }} 份待支付
        </v-chip>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <v-card v-if="!loading && !pendingLeases.length" elevation="0">
        <div class="house-empty">
          <v-icon>mdi-file-document-check-outline</v-icon>
          <div>暂无待支付合同。</div>
          <v-btn color="primary" variant="tonal" class="mt-2" to="/houseList">去看看房源</v-btn>
        </div>
      </v-card>

      <v-card v-for="lease in pendingLeases" :key="lease.id" class="lease-card mb-3 pa-4" elevation="0">
        <div class="lease-row">
          <div class="lease-thumb">
            <v-icon size="32" color="primary">mdi-file-document-outline</v-icon>
          </div>
          <div class="lease-info">
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
              <h3 class="lease-title">合同 {{ lease.id }}</h3>
              <v-chip color="warning" size="small" variant="tonal">待支付</v-chip>
            </div>
            <div class="house-muted text-body-2">房源 {{ lease.houseId }} · {{ lease.purpose }}</div>
            <div class="house-muted text-body-2">
              <v-icon size="14" class="mr-1">mdi-calendar-range</v-icon>{{ lease.startDate }} 至 {{ lease.endDate }}
            </div>
          </div>
          <div class="lease-side">
            <div class="house-price text-h6">¥{{ lease.rentValue }}<small>/月</small></div>
            <div class="d-flex flex-wrap justify-end ga-2">
              <v-btn variant="outlined" :disabled="submitting" @click="cancelLease(lease.id)">取消合同</v-btn>
              <v-btn color="primary" variant="flat" :active="false" :to="{ path: '/contract', query: { houseid: lease.houseId } }">继续支付</v-btn>
            </div>
          </div>
        </div>
      </v-card>
    </template>

    <!-- 签约表单 -->
    <v-card v-if="houseId" :loading="loading" elevation="0" class="sign-card">
      <v-card-title class="pa-6 pb-2 house-section-title">房屋租赁签约</v-card-title>
      <v-card-text class="pa-6 pt-2">
        <template v-if="house">
          <v-alert v-if="contractId" type="info" variant="tonal" class="mb-5">已恢复待支付合同 {{ contractId }}，可继续支付或取消。</v-alert>
          <div class="lease-row mb-5">
            <div class="lease-thumb">
              <v-icon size="32" color="primary">mdi-home-outline</v-icon>
            </div>
            <div class="lease-info">
              <h3 class="lease-title mb-1">{{ house.title }}</h3>
              <div class="house-muted text-body-2">
                {{ house.region }} {{ house.block }} {{ house.community }} · {{ house.rooms }} · {{ house.area }}㎡
              </div>
            </div>
            <div class="lease-side">
              <div class="house-price text-h5">¥{{ house.price }}<small>/月</small></div>
            </div>
          </div>
          <v-alert type="info" variant="tonal" density="compact" class="mb-5">
            租金与签约人身份将由服务器核验，无法在此修改。
          </v-alert>
          <v-text-field v-model="purpose" :disabled="!!contractId" label="租赁用途" maxlength="50" />
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="startDate" :disabled="!!contractId" type="date" label="起租日期" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="endDate" :disabled="!!contractId" type="date" label="结束日期" />
            </v-col>
          </v-row>
          <v-checkbox v-model="agreed" :disabled="!!contractId" hide-details label="我已阅读并同意房屋租赁约定" />
        </template>
      </v-card-text>
      <v-card-actions v-if="house" class="pa-6 pt-0 flex-wrap ga-2">
        <v-btn v-if="contractId" variant="outlined" color="error" :disabled="submitting" @click="cancelLease(contractId)">取消合同</v-btn>
        <v-spacer />
        <v-btn
          variant="tonal"
          size="large"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          @click="submitLease(true)"
        >
          本地模拟支付
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          @click="submitLease(false)"
        >
          {{ contractId ? '继续支付宝支付' : '创建合同并前往支付宝' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </section>
</template>

<style scoped>
.sign-card { max-width: 900px; margin: 0 auto; }
.lease-row { display: flex; align-items: center; gap: 16px; }
.lease-thumb { flex: 0 0 72px; width: 72px; height: 72px; border-radius: var(--house-radius); background: var(--house-soft); display: flex; align-items: center; justify-content: center; }
.lease-info { flex: 1 1 auto; min-width: 0; }
.lease-title { color: var(--house-ink); font-size: 1.05rem; font-weight: 700; }
.lease-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
@media (max-width: 600px) {
  .lease-row { flex-wrap: wrap; }
  .lease-side { width: 100%; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
}
</style>
