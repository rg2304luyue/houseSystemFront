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
      <div class="brand pa-6">
        <img src="@/assets/logo-house.svg" alt="好客租房" width="26" height="26" />
        <div><strong>好客租房</strong><span>让找房更笃定</span></div>
      </div>
    </template>
    <main-menu :menu="configs.navigation.menu" />
  </v-navigation-drawer>
</template>

<style scoped>
.brand { display: flex; align-items: center; gap: 12px; color: #f4f7fb; }
.brand img { filter: brightness(0) invert(1); }
.brand strong { display: block; font-size: 1.2rem; letter-spacing: .08em; }
.brand span { display: block; margin-top: 3px; font-size: .75rem; opacity: .72; }
</style>
