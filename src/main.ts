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
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'vue-advanced-cropper/dist/style.css';

// Remove the legacy browser-persisted OpenAI key. The active AI service is
// configured only on the FastAPI server and no provider secret belongs here.
localStorage.removeItem("chatGPT");

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(PerfectScrollbar);
app.use(i18n);
app.use(vuetify);
app.mount("#app");
