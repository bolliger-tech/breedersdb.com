import type { RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import { toKebabCase } from 'src/utils/stringUtils';

function entityNameToRoutePath(entity: string) {
  // path is kebab cased EntityName minus 'Plant' prefix
  // eg. PlantRows -> rows,
  // eg. AttributionForms -> attribution-forms
  return toKebabCase(
    entity !== 'Plants' && entity.startsWith('Plant')
      ? entity.replace(/^Plant/, '')
      : entity,
  );
}

function createAttributeAndAnalyzeRoutes(entity: string) {
  const basePath = '/' + entityNameToRoutePath(entity);
  return {
    path: basePath,
    meta: { navPaths: [basePath] },
    children: [
      {
        path: 'attribute',
        component: () => import(`pages/${entity}/AddAttributionPage.vue`),
      },
      {
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
              analyzeId: parseInt(
                route.params.analyzeId?.toString() ?? '-1',
                10,
              ),
              key: route.params.analyzeId,
            }),
          },
          {
            path: 'new',
            component: () => import(`pages/${entity}/AnalyzePage.vue`),
            props: { analyzeId: 'new', key: 'new' },
          },
        ],
      },
    ],
  };
}

function createEntityRoutes(entity: string) {
  const basePath = '/' + entityNameToRoutePath(entity);
  return {
    path: basePath,
    meta: { navPaths: [basePath] },
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
            path: ':entityId(\\d+)/edit',
            component: () => import(`pages/${entity}/EditModal.vue`),
            props: true,
          },
          {
            path: 'new/:templateId(\\d+)?',
            component: () => import(`pages/${entity}/AddModal.vue`),
            props: (route: RouteLocationNormalized) => ({
              entityId: 'new',
              templateId: route.params.templateId
                ? parseInt(route.params.templateId.toString(), 10)
                : undefined,
            }),
          },
        ],
      },
    ],
  };
}

const routes: RouteRecordRaw[] = [
  {
    path: '/sign-in',
    component: () => import('layouts/UnauthenticatedLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Auth/SignInPage.vue'),
      },
    ],
  },
  {
    path: '/forgot-password',
    component: () => import('layouts/UnauthenticatedLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Auth/ForgotPasswordPage.vue'),
      },
    ],
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
        'PlantGroups',
        'Plants',
      ].map(createEntityRoutes),

      {
        path: '/attributions',
        meta: { navPaths: ['/attributions'] },
        component: () => import('pages/Attributions/IndexPage.vue'),
        children: [
          {
            path: ':entityId(\\d+)',
            component: () => import('pages/Attributions/ViewModal.vue'),
            props: true,
          },
          {
            path: ':entityId(\\d+)/edit',
            component: () => import('pages/Attributions/EditModal.vue'),
            props: true,
          },
        ],
      },

      ...['Plants', 'PlantGroups', 'Cultivars', 'Lots'].map(
        createAttributeAndAnalyzeRoutes,
      ),

      {
        path: '/plants',
        children: [
          {
            path: 'plant',
            component: () => import('pages/Plants/PlantingPage.vue'),
          },
          {
            path: 'eliminate',
            component: () => import('pages/Plants/EliminatingPage.vue'),
          },
        ],
      },

      {
        path: '/settings',
        component: () => import('pages/Settings/IndexPage.vue'),
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
