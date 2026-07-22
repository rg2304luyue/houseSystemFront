/**
 * main.js
 *
 */

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";
import vuetify from "./plugins/vuetify";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import "@/styles/main.scss";
import router from "./router";
import i18n from "./plugins/i18n";
import "vue3-lottie/dist/style.css";
import Vue3Lottie from "vue3-lottie";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'vue-advanced-cropper/dist/style.css';
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(PerfectScrollbar);
app.use(i18n);
app.use(Vue3Lottie, { name: "LottieAnimation" });
app.use(vuetify);
app.mount("#app");
