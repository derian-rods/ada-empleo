import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useNavigationStore } from "./stores/navigation";
import { useDashboardStore } from "./stores/dashboard";

// Lazy load views
const DashboardView = () => import("./views/DashboardView.vue");
const TablesView = () => import("./views/TablesView.vue");
const ChartsView = () => import("./views/ChartsView.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    component: DashboardView,
    meta: { title: "Dashboard", requiresData: false },
  },
  {
    path: "/tables",
    component: TablesView,
    meta: { title: "Tablas", requiresData: true },
  },
  {
    path: "/charts",
    component: ChartsView,
    meta: { title: "Gráficos", requiresData: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard para mostrar/ocultar loading
router.beforeEach((to, from, next) => {
  const dashboardStore = useDashboardStore();

  // Si la ruta requiere datos y no los hay, redirigir a dashboard
  if (to.meta.requiresData && !dashboardStore.hasData) {
    next("/dashboard");
    return;
  }

  if (to.path !== from.path) {
    const navigationStore = useNavigationStore();
    navigationStore.setIsNavigating(true);
  }
  next();
});

router.afterEach(() => {
  const navigationStore = useNavigationStore();
  // Desactivar loading después de que se complete la navegación
  setTimeout(() => {
    navigationStore.setIsNavigating(false);
  }, 200);
});

export default router;
