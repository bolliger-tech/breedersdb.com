import { RouteRecordRaw } from 'vue-router';
import zitadelAuth from '../services/zitadelAuth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/trees' },
      {
        path: 'trees',
        children: [
          { path: '', component: () => import('pages/Trees/IndexPage.vue') },
        ],
      },
      {
        path: 'cultivars',
        children: [
          {
            path: 'analyze',
            component: () => import('pages/Cultivars/AnalyzePage.vue'),
          },
        ],
      },

      {
        path: 'dev',
        children: [
          { path: '', component: () => import('pages/Dev/IndexPage.vue') },
          { path: 'typo', component: () => import('pages/Dev/TypoPage.vue') },
          {
            path: 'user',
            meta: {
              authName: zitadelAuth.oidcAuth.authName,
            },
            component: () => import('pages/Dev/UserPage.vue'),
          },
        ],
      },

      // Always leave this as last one,
      // but you can also remove it
      {
        path: ':catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue'),
      },
    ],
  },
];

export default routes;
