import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/productions', component: () => import('../views/ProductionsView.vue') },
    { path: '/productions/:id', component: () => import('../views/ProductionDetailView.vue'), props: true },
    { path: '/shows', component: () => import('../views/ShowsView.vue') },
    { path: '/shows/:productionId', component: () => import('../views/ShowsView.vue'), props: true },
    { path: '/subscriptions', component: () => import('../views/SubscriptionsView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue') },
  ],
})

export default router
