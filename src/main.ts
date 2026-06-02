import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import { CCVPreset } from "./theme/preset";
import VChart from "vue-echarts";
import "primeicons/primeicons.css";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: CCVPreset,
    options: {
      darkModeSelector: ".app-dark",
      cssLayer: false,
      prefix: "p",
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);
app.component("VChart", VChart);

app.mount("#app");
