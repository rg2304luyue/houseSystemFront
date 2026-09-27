/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
// Composables
import { createVuetify } from "vuetify";
import type { ThemeDefinition } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { useI18n } from "vue-i18n";
import i18n from "@/plugins/i18n";
import * as labs from "vuetify/labs/components";
// 1. 直接从 vuetify/locale 导入中文语言包
import { zhHans } from 'vuetify/locale'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides

const Lighttheme: ThemeDefinition = {
  dark: false,
  variables: {
    "high-emphasis-opacity": 0.92,
    "medium-emphasis-opacity": 0.62,
  },
  colors: {
    background: "#f7f8fa",
    surface: "#ffffff",
    "surface-variant": "#eef1f4",
    primary: "#0f766e",
    secondary: "#1f2933",
    accent: "#f2622e",
    error: "#dc3545",
    info: "#2563eb",
    success: "#16a34a",
    "on-success": "#ffffff",
    warning: "#f59e0b",
  },
};

const Darktheme: ThemeDefinition = {
  dark: true,
  variables: {
    "high-emphasis-opacity": 0.92,
    "medium-emphasis-opacity": 0.64,
  },
  colors: {
    background: "#0f1419",
    surface: "#171d24",
    "surface-variant": "#222a33",
    primary: "#2dd4bf",
    "on-primary": "#062a26",
    secondary: "#cbd5e1",
    accent: "#ff8a5c",
    error: "#f87171",
    info: "#60a5fa",
    success: "#4ade80",
    warning: "#fbbf24",
  },
};

export default createVuetify({
  components: {
    ...components,
    ...labs,
  },
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: Lighttheme,
      dark: Darktheme,
    },
  },
  defaults: {
    VBtn: {
      rounded: "lg",
      fontWeight: "500",
      letterSpacing: "0",
    },
    VCard: {
      rounded: "lg",
    },
    VSheet: {
      elevation: 0,
    },
    VTable: {
      elevation: 0,
    },
    VChip: {
      rounded: "md",
    },
    VDataTable: {
      fixedHeader: true,
      noDataText: "暂无数据",
    },
    VTextField: {
      variant: "outlined",
      rounded: "lg",
    },
    VSelect: {
      variant: "outlined",
      rounded: "lg",
    },
  },
 // 2. 添加 locale 配置块
  locale: {
    locale: 'zhHans', // 设置当前默认语言
    fallback: 'en', // 设置回退语言
    messages: { zhHans }, // 将导入的语言包提供给 Vuetify
  },
});
