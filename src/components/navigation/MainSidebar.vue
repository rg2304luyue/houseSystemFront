<script setup lang="ts">
import { onMounted } from "vue";
import configs from "@/configs";
import MainMenu from "@/components/navigation/MainMenu.vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";

const customizeTheme = useCustomizeThemeStore();

onMounted(() => {
  const contentArea = document.querySelector(".v-navigation-drawer__content");
  const activeItem = document.querySelector(".v-list-item--active") as HTMLElement;
  setTimeout(() => contentArea?.scrollTo({ top: activeItem?.offsetTop }), 100);
});
</script>

<template>
  <v-navigation-drawer v-model="customizeTheme.mainSidebar" border="none" elevation="0" temporary id="mainMenu">
    <template v-if="!customizeTheme.miniSidebar" #prepend>
      <div class="brand pa-5">
        <span class="brand-mark"><img src="@/assets/logo-house.svg" alt="好客租房" width="18" height="18" /></span>
        <div><strong>好客租房</strong><span>让找房更笃定</span></div>
      </div>
    </template>
    <main-menu :menu="configs.navigation.menu" />
  </v-navigation-drawer>
</template>

<style scoped>
.brand { display: flex; align-items: center; gap: 12px; color: var(--house-ink); }
.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
}
.brand-mark img { filter: brightness(0) invert(1); }
.brand strong { display: block; font-size: 1.1rem; letter-spacing: .04em; }
.brand span { display: block; margin-top: 2px; font-size: .75rem; color: var(--house-muted); }
</style>
