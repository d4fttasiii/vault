import { createRouter, createWebHistory } from 'vue-router';

import Documents from '../views/Documents.vue';
import HomeView from '../views/HomeView.vue';
import Upload from '../views/Upload.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/documents',
      name: 'documents',
      component: Documents
    },
    {
      path: '/upload',
      name: 'upload',
      component: Upload
    }
  ]
})

export default router
