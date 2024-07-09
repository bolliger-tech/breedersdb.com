import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/sign-in',
    component: () => import('pages/Auth/SignInPage.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/sign-out',
        component: () => import('pages/Auth/SignOutPage.vue'),
      },
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
                component: () => import('pages/Plants/AddModal.vue'),
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
        path: 'users',
        children: [
          {
            path: '',
            component: () => import('pages/Users/IndexPage.vue'),
            children: [
              {
                path: ':entityId(\\d+)',
                component: () => import('pages/Users/ViewModal.vue'),
                props: true,
              },
              {
                path: ':entityId/edit',
                component: () => import('pages/Users/EditModal.vue'),
                props: true,
              },
              {
                path: 'new',
                component: () => import('pages/Users/AddModal.vue'),
                props: { entityId: 'new' },
              },
            ],
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
