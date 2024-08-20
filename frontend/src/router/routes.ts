import { RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import { toKebabCase } from 'src/utils/stringUtils';

function createAnalyzeRoutes(entity: string) {
  return {
    path: 'analyze',
    children: [
      {
        path: '',
        component: () => import(`pages/${entity}/AnalyzeIndexPage.vue`),
      },
      {
        path: ':analyzeId(\\d+)',
        component: () => import(`pages/${entity}/AnalyzePage.vue`),
        props: (route: RouteLocationNormalized) => ({
          analyzeId: route.params.analyzeId,
          key: route.params.analyzeId,
        }),
      },
      {
        path: 'new',
        component: () => import(`pages/${entity}/AnalyzePage.vue`),
        props: { analyzeId: 'new', key: 'new' },
      },
    ],
  };
}

function createEntityRoutes(entity: string) {
  return {
    // path is kebab cased EntityName minus 'Plant' prefix
    // eg. PlantRows -> rows,
    // eg. AttributionForms -> attribution-forms
    path: toKebabCase(
      entity.startsWith('Plant') ? entity.split('Plant').slice(-1)[0] : entity,
    ),
    children: [
      {
        path: '',
        component: () => import(`pages/${entity}/IndexPage.vue`),
        children: [
          {
            path: ':entityId(\\d+)',
            component: () => import(`pages/${entity}/ViewModal.vue`),
            props: true,
          },
          {
            path: ':entityId/edit',
            component: () => import(`pages/${entity}/EditModal.vue`),
            props: true,
          },
          {
            path: 'new',
            component: () => import(`pages/${entity}/AddModal.vue`),
            props: { entityId: 'new' },
          },
        ],
      },
    ],
  };
}

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
          {
            path: 'attribute',
            component: () => import('pages/Plants/AttributionPage.vue'),
          },
          createAnalyzeRoutes('Plants'),
        ],
      },

      {
        path: 'plant-groups',
        children: [createAnalyzeRoutes('PlantGroups')],
      },

      {
        path: 'cultivars',
        children: [createAnalyzeRoutes('Cultivars')],
      },

      {
        path: 'lots',
        children: [createAnalyzeRoutes('Lots')],
      },

      ...[
        'Users',
        'Orchards',
        'Rootstocks',
        'Graftings',
        'PlantRows',
        'Cultivars',
        'Crossings',
        'Pollen',
        'MotherPlants',
        'Attributes',
        'AttributionForms',
        'Lots',
      ].map(createEntityRoutes),

      {
        path: 'dev',
        children: [
          { path: '', component: () => import('pages/Dev/IndexPage.vue') },
          { path: 'typo', component: () => import('pages/Dev/TypoPage.vue') },
          {
            path: 'images',
            component: () => import('pages/Dev/ImageUpDownloadPage.vue'),
          },
          { path: 'qr', component: () => import('pages/Dev/QrPage.vue') },
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
