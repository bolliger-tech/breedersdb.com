<template>
  <nav class="full-height">
    <NavLevel0 :items="items" />
  </nav>
</template>

<script setup lang="ts">
import DarkModeSetter from '../DarkMode/DarkModeSetter.vue';
import LanguageSetter from '../LanguageSetter.vue';
import NavLevel0, { NavLevel0Props } from './NavLevel0.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();

const items: NavLevel0Props['items'] = [
  {
    label: t('layout.nav.trees.main'),
    to: '/trees',
    icon: 'tree',
    children: [
      {
        label: t('layout.nav.trees.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('layout.nav.trees.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('layout.nav.trees.plant'),
        icon: 'shovel',
        to: 'plant',
      },
      {
        label: t('layout.nav.trees.eliminate'),
        icon: 'trash',
        to: 'eliminate',
      },
      {
        label: t('layout.nav.trees.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('layout.nav.trees.query'),
        icon: 'search',
        to: 'query',
      },
    ],
  },
  {
    label: t('layout.nav.groups.main'),
    to: '/groups',
    icon: 'tree-group',
    children: [
      {
        label: t('layout.nav.groups.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('layout.nav.groups.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('layout.nav.groups.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('layout.nav.groups.query'),
        icon: 'search',
        to: 'query',
      },
    ],
  },
  {
    label: t('layout.nav.cultivars.main'),
    icon: 'cultivar',
    to: '/cultivars',
    children: [
      {
        label: t('layout.nav.cultivars.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('layout.nav.cultivars.new.main'),
        icon: 'add',
        to: 'new',
        children: [
          {
            label: t('layout.nav.cultivars.new.breedersCultivar'),
            to: 'breeders-cultivar',
          },
          {
            label: t('layout.nav.cultivars.new.variety'),
            to: 'variety',
          },
        ],
      },
      {
        label: t('layout.nav.cultivars.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('layout.nav.cultivars.query'),
        icon: 'search',
        to: 'query',
      },
    ],
  },
  {
    label: t('layout.nav.lots.main'),
    to: '/lots',
    icon: 'lot',
    children: [
      {
        label: t('layout.nav.lots.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('layout.nav.lots.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('layout.nav.lots.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('layout.nav.lots.query'),
        icon: 'search',
        to: 'query',
      },
    ],
  },
  {
    label: t('layout.nav.crossings.main'),
    to: '/crossings',
    icon: 'blossom',
    children: [
      {
        label: t('layout.nav.crossings.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('layout.nav.crossings.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('layout.nav.crossings.motherTrees.main'),
        to: 'mother-trees',
        icon: 'female',
        children: [
          {
            label: t('layout.nav.crossings.motherTrees.list'),
            to: '',
          },
          {
            label: t('layout.nav.crossings.motherTrees.new'),
            to: 'new',
          },
        ],
      },
      {
        label: t('layout.nav.crossings.pollen.main'),
        to: 'pollen',
        icon: 'male',
        children: [
          {
            label: t('layout.nav.crossings.pollen.list'),
            to: '',
          },
          {
            label: t('layout.nav.crossings.pollen.new'),
            to: 'new',
          },
        ],
      },
    ],
  },
  {
    label: t('layout.nav.more.main'),
    icon: 'more',
    to: '/more',
    children: [
      {
        label: t('layout.nav.more.attributeForms.main'),
        icon: 'form',
        to: 'attribute-forms',
        children: [
          {
            label: t('layout.nav.more.attributeForms.forms'),
            to: 'forms',
          },
          {
            label: t('layout.nav.more.attributeForms.attributes'),
            to: 'attributes',
          },
        ],
      },
      {
        label: t('layout.nav.more.rows'),
        icon: 'rows',
        to: 'rows',
      },
      {
        label: t('layout.nav.more.orchards'),
        icon: 'orchard',
        to: 'orchards',
      },
      {
        label: t('layout.nav.more.rootstocks'),
        icon: 'rootstock',
        to: 'rootstocks',
      },
      {
        label: t('layout.nav.more.graftings'),
        icon: 'grafting',
        to: 'graftings',
      },
      {
        label: t('layout.nav.more.users'),
        icon: 'user',
        to: 'users',
      },
      {
        label: t('layout.nav.more.settings'),
        icon: 'settings',
        to: 'settings',
      },
      {
        label: t('layout.nav.more.darkMode.main'),
        icon: 'dark-mode',
        to: 'dark-mode',
        children: [
          {
            to: 'on',
            component: {
              component: DarkModeSetter,
              props: {
                isDark: true,
                label: t('layout.nav.more.darkMode.on'),
              },
            },
          },
          {
            to: 'off',
            component: {
              component: DarkModeSetter,
              props: {
                isDark: false,
                label: t('layout.nav.more.darkMode.off'),
              },
            },
          },
        ],
      },
      {
        label: t('layout.nav.more.language.main'),
        icon: 'locale',
        to: 'language',
        children: [
          {
            to: 'en',
            component: {
              component: LanguageSetter,
              props: {
                locale: 'en-US',
                label: t('layout.nav.more.language.en'),
              },
            },
          },
          {
            to: 'de',
            component: {
              component: LanguageSetter,
              props: {
                locale: 'de-CH',
                label: t('layout.nav.more.language.de'),
              },
            },
          },
        ],
      },
      {
        label: t('layout.nav.more.logout'),
        icon: 'logout',
        to: 'logout',
      },
    ],
  },
];
</script>
