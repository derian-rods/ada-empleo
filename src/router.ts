import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Lazy load views
const DashboardView = () => import('./views/DashboardView.vue')
const TablesView = () => import('./views/TablesView.vue')
const ChartsView = () => import('./views/ChartsView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard' },
  },
  {
    path: '/tables',
    component: TablesView,
    meta: { title: 'Tablas' },
  },
  {
    path: '/charts',
    component: ChartsView,
    meta: { title: 'Gráficos' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard para permitir navegación incluso durante procesamiento
router.beforeEach((_, __, next) => {
  // Permitir siempre la navegación - no bloquear durante procesamiento
  next()
})

export default router

