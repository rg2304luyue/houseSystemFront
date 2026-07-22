<script setup lang="ts">
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import ToolbarUser from "./ToolbarUser.vue";

const { mdAndUp } = useDisplay();
const customizeTheme = useCustomizeThemeStore();
const router = useRouter();
const searchQuery = ref("");

const searchHouses = () => {
  const community = searchQuery.value.trim();
  router.push({ path: "/houseList", query: community ? { community } : {} });
};
</script>

<template>
  <v-app-bar :density="mdAndUp ? 'default' : 'compact'" elevation="0">
    <div class="px-2 d-flex align-center justify-space-between w-100">
      <v-app-bar-nav-icon @click="customizeTheme.mainSidebar = !customizeTheme.mainSidebar" />
      <v-text-field
        v-if="mdAndUp"
        v-model="searchQuery"
        class="ml-2 house-search"
        color="primary"
        variant="solo"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        placeholder="搜索区域、小区或商圈"
        @keyup.enter="searchHouses"
      />
      <v-spacer />
      <ToolbarUser />
    </div>
  </v-app-bar>
</template>

<style scoped>
.house-search { max-width: 420px; }
</style>
