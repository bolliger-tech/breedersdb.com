import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/plants' },
      {
        path: 'plants',
        children: [
          {
            path: '',
            component: () => import('pages/Plants/IndexPage.vue'),
            children: [
              {
                path: ':entityId(\\d+)',
                component: () => import('pages/Plants/ViewModal.vue'),
                props: true,
              },
              {
                path: ':entityId/edit',
                component: () => import('pages/Plants/EditModal.vue'),
                props: true,
              },
              {
                path: 'new',
                component: () => import('pages/Plants/EditModal.vue'),
                props: { entityId: 'new' },
              },
            ],
          },
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
            path: 'images',
            component: () => import('pages/Dev/ImageUpDownloadPage.vue'),
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
