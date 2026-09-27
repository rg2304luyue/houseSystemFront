import { defineStore } from "pinia";

interface Color {
  colorId: number;
  colorName: string;
  colorValue: string;
}

interface State {
  miniSidebar: boolean;
  darkTheme: boolean;
  primaryColor: Color;
  mainSidebar: boolean;
  localCode: string;
  themeDrawer: boolean
}

export const useCustomizeThemeStore = defineStore({
  id: "customizeTheme",
  state: (): State => ({
    miniSidebar: false,
    darkTheme: false,
    primaryColor: {
      colorId: 2,
      colorName: "grey",
      colorValue: "#0f766e",
    },
    themeDrawer: false, // 新增这个状态
    localCode: "en",
    mainSidebar: false,
  }),

  persist: {
    storage: localStorage,
    pick: ["darkTheme", "primaryColor", "localCode", "mainSidebar"],
  },

  getters: {},
  actions: {
    setMiniSideBar(payload: boolean) {
      this.miniSidebar = payload;
    },
    setPrimaryColor(payload: Color) {
      this.primaryColor = payload;
    },
    setLocalCode(localCode: string) {
      this.localCode = localCode;
    },
  },
});
