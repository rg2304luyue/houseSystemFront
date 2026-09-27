<script setup lang="ts">
import { useCustomizeThemeStore } from "@/stores/customizeTheme";

// App.vue 监听 darkTheme 并同步 Vuetify 主题，这里只切换持久化状态
const customizeTheme = useCustomizeThemeStore();
</script>

<template>
  <v-btn
    icon
    variant="text"
    size="small"
    :title="customizeTheme.darkTheme ? '切换到浅色' : '切换到深色'"
    @click="customizeTheme.darkTheme = !customizeTheme.darkTheme"
  >
    <v-icon>{{ customizeTheme.darkTheme ? "mdi-weather-sunny" : "mdi-weather-night" }}</v-icon>
  </v-btn>
</template>
