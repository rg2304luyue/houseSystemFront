<script setup lang="ts">
import { computed } from "vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { useProfileStore } from "@/stores/profileStore";
const customizeTheme = useCustomizeThemeStore();
const profileStore = useProfileStore();

const props = defineProps({
  // Data
  menu: {
    type: Array<any>,
    default: () => [],
  },
});

const canAccess = (item: any) =>
  !item.roles || item.roles.includes(Number(profileStore.user?.userType));

const visibleMenu = computed(() =>
  props.menu
    .map((area) => ({
      ...area,
      items: area.items?.filter((item) =>
        item.items ? item.items.some((child) => canAccess(child)) : canAccess(item),
      ),
    }))
    .filter((area) => area.items?.length),
);
</script>
<template>
  <v-list class="menu-list" nav dense color="primary">
    <template v-for="menuArea in visibleMenu" :key="menuArea.key">
      <div
        v-if="!customizeTheme.miniSidebar && (menuArea.key || menuArea.text)"
        class="px-5 pt-2 pb-1 text-caption house-muted"
      >
        {{ menuArea.text }}
      </div>
      <template v-if="menuArea.items">
        <template v-for="menuItem in menuArea.items" :key="menuItem.key">
          <!-- menu level 1 -->
          <v-list-item
            v-if="!menuItem.items && canAccess(menuItem)"
            :to="menuItem.link"
            :prepend-icon="menuItem.icon || 'mdi-circle-medium'"
            density="compact"
          >
            <v-list-item-title v-text="menuItem.text"></v-list-item-title>
          </v-list-item>
          <v-list-group v-else :value="menuItem.items">
            <!-- subMenu activator -->
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="menuItem.icon || 'mdi-circle-medium'"
                :title="menuItem.text"
              >
              </v-list-item>
            </template>
            <!-- menu level 2 -->
            <v-list-item
              v-for="subMenuItem in menuItem.items"
              :key="subMenuItem.key"
              v-show="canAccess(subMenuItem)"
              :prepend-icon="subMenuItem.icon || 'mdi-circle-medium'"
              :title="subMenuItem.text"
              :to="subMenuItem.link"
              density="compact"
            ></v-list-item>
          </v-list-group>
        </template>
      </template>
    </template>
  </v-list>
</template>

<style scoped>
.v-list-group .v-list-item {
  padding-left: 8px !important;
}

.menu-list :deep(.v-list-item--active) {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
