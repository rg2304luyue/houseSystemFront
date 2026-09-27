<script setup lang="ts">
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { useNavigationItems } from "@/composables/useNavigationItems";
import ToolbarUser from "./ToolbarUser.vue";
import ThemeToggle from "./ThemeToggle.vue";

const { mdAndUp } = useDisplay();
const customizeTheme = useCustomizeThemeStore();
const router = useRouter();
const navItems = useNavigationItems();
const searchQuery = ref("");

const searchHouses = () => {
  const community = searchQuery.value.trim();
  router.push({ path: "/houseList", query: community ? { community } : {} });
};
</script>

<template>
  <v-app-bar :height="mdAndUp ? 68 : 56" elevation="0">
    <div class="appbar-inner">
      <v-app-bar-nav-icon
        v-if="!mdAndUp"
        @click="customizeTheme.mainSidebar = !customizeTheme.mainSidebar"
      />
      <router-link to="/dashboard" class="brand">
        <span class="brand-mark"><img src="@/assets/logo-house.svg" alt="" width="18" height="18" /></span>
        <span class="brand-name">好客租房</span>
      </router-link>

      <nav v-if="mdAndUp" class="top-nav">
        <router-link v-for="item in navItems" :key="item.link" :to="item.link" class="top-nav-link">
          {{ item.text }}
        </router-link>
      </nav>

      <v-spacer />

      <v-text-field
        v-if="mdAndUp"
        v-model="searchQuery"
        class="house-search"
        variant="solo-filled"
        flat
        rounded="pill"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        placeholder="搜索区域、小区或商圈"
        @keyup.enter="searchHouses"
      />
      <ThemeToggle />
      <ToolbarUser />
    </div>
  </v-app-bar>
</template>

<style scoped>
.appbar-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 1280px);
  margin-inline: auto;
  padding-inline: 16px;
}
.brand { display: inline-flex; align-items: center; gap: 10px; color: var(--house-ink); margin-right: 20px; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
}
.brand-mark img { filter: brightness(0) invert(1); }
.brand-name { font-size: 1.12rem; font-weight: 700; letter-spacing: .04em; white-space: nowrap; }
.top-nav { display: flex; align-items: center; gap: 4px; }
.top-nav-link {
  position: relative;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--house-muted);
  font-size: .94rem;
  font-weight: 500;
  white-space: nowrap;
  transition: color .15s ease, background-color .15s ease;
}
.top-nav-link:hover { color: var(--house-ink); background: rgba(var(--v-theme-on-surface), .05); }
.top-nav-link.router-link-active { color: rgb(var(--v-theme-primary)); font-weight: 600; }
.top-nav-link.router-link-active::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -13px;
  height: 2px;
  border-radius: 2px;
  background: rgb(var(--v-theme-primary));
}
.house-search { max-width: 280px; margin-right: 4px; }
@media (max-width: 1100px) { .house-search { display: none; } }
</style>
