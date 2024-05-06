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
    label: t('nav.trees.main'),
    to: '/trees',
    icon: 'tree',
    children: [
      {
        label: t('nav.shared.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('nav.shared.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('nav.trees.plant'),
        icon: 'shovel',
        to: 'plant',
      },
      {
        label: t('nav.trees.eliminate'),
        icon: 'trash',
        to: 'eliminate',
      },
      {
        label: t('nav.shared.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('nav.groups.main'),
    to: '/groups',
    icon: 'tree-group',
    children: [
      {
        label: t('nav.shared.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('nav.shared.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('nav.shared.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('nav.cultivars.main'),
    icon: 'cultivar',
    to: '/cultivars',
    children: [
      {
        label: t('nav.shared.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('nav.cultivars.new.main'),
        icon: 'add',
        to: 'new',
        children: [
          {
            label: t('nav.cultivars.new.breedersCultivar'),
            to: 'breeders-cultivar',
          },
          {
            label: t('nav.cultivars.new.variety'),
            to: 'variety',
          },
        ],
      },
      {
        label: t('nav.shared.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('nav.lots.main'),
    to: '/lots',
    icon: 'lot',
    children: [
      {
        label: t('nav.shared.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('nav.shared.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('nav.shared.addAttribute'),
        icon: 'star',
        to: 'add-attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('nav.crossings.main'),
    to: '/crossings',
    icon: 'blossom',
    children: [
      {
        label: t('nav.shared.list'),
        icon: 'list',
        to: '',
      },
      {
        label: t('nav.shared.new'),
        icon: 'add',
        to: 'new',
      },
      {
        label: t('nav.crossings.motherTrees.main'),
        to: 'mother-trees',
        icon: 'female',
        children: [
          {
            label: t('nav.shared.list'),
            to: '',
          },
          {
            label: t('nav.shared.new'),
            to: 'new',
          },
        ],
      },
      {
        label: t('nav.crossings.pollen.main'),
        to: 'pollen',
        icon: 'male',
        children: [
          {
            label: t('nav.shared.list'),
            to: '',
          },
          {
            label: t('nav.shared.new'),
            to: 'new',
          },
        ],
      },
    ],
  },
  {
    label: t('nav.more.main'),
    icon: 'more',
    to: '/more',
    children: [
      {
        label: t('nav.more.attributionForms.main'),
        icon: 'form',
        to: 'attribution-forms',
        children: [
          {
            label: t('nav.more.attributionForms.forms'),
            to: 'forms',
          },
          {
            label: t('nav.more.attributionForms.attributes'),
            to: 'attributes',
          },
        ],
      },
      {
        label: t('nav.more.rows'),
        icon: 'rows',
        to: 'rows',
      },
      {
        label: t('nav.more.orchards'),
        icon: 'orchard',
        to: 'orchards',
      },
      {
        label: t('nav.more.rootstocks'),
        icon: 'rootstock',
        to: 'rootstocks',
      },
      {
        label: t('nav.more.graftings'),
        icon: 'grafting',
        to: 'graftings',
      },
      {
        label: t('nav.more.users'),
        icon: 'user',
        to: 'users',
      },
      {
        label: t('nav.more.settings'),
        icon: 'settings',
        to: 'settings',
      },
      {
        label: t('nav.more.darkMode.main'),
        icon: 'dark-mode',
        to: 'dark-mode',
        children: [
          {
            to: 'on',
            component: {
              component: DarkModeSetter,
              props: {
                isDark: true,
                label: t('nav.more.darkMode.on'),
              },
            },
          },
          {
            to: 'off',
            component: {
              component: DarkModeSetter,
              props: {
                isDark: false,
                label: t('nav.more.darkMode.off'),
              },
            },
          },
        ],
      },
      {
        label: t('nav.more.language.main'),
        icon: 'locale',
        to: 'language',
        children: [
          {
            to: 'en',
            component: {
              component: LanguageSetter,
              props: {
                locale: 'en-US',
                label: 'English',
              },
            },
          },
          {
            to: 'de',
            component: {
              component: LanguageSetter,
              props: {
                locale: 'de-CH',
                label: 'Deutsch',
              },
            },
          },
        ],
      },
      {
        label: t('nav.more.logout'),
        icon: 'logout',
        to: 'logout',
      },
    ],
  },
];
</script>
