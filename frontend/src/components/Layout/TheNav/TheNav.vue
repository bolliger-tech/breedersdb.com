<template>
  <nav class="full-height">
    <NavLevel0 :items="navItems" />
  </nav>
</template>

<script setup lang="ts">
import DarkModeSetter from 'src/components/Layout/DarkMode/DarkModeSetter.vue';
import LanguageSetter from 'src/components/Layout/LanguageSetter.vue';
import NavLevel0 from './NavLevel0.vue';
import { useI18n } from 'src/composables/useI18n';
import { type NavItem } from 'src/components/Layout/TheNav/useNavItem';

const { t } = useI18n();

type NavDefinitionItem = Pick<
  NavItem,
  'to' | 'label' | 'icon' | 'component'
> & {
  children?: NavDefinitionItem[];
};

const navDefinition: NavDefinitionItem[] = [
  {
    label: t('plants.title', 2),
    to: '/plants',
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
        label: t('nav.plants.plant'),
        icon: 'shovel',
        to: 'plant',
      },
      {
        label: t('nav.plants.eliminate'),
        icon: 'trash',
        to: 'eliminate',
      },
      {
        label: t('nav.shared.addAttribute'),
        icon: 'star',
        to: 'attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('plantGroups.title', 2),
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
        to: 'attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('cultivars.title', 2),
    icon: 'cultivar',
    to: '/cultivars',
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
        to: 'attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('lots.title', 2),
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
        to: 'attribute',
      },
      {
        label: t('nav.shared.analyze'),
        icon: 'search',
        to: 'analyze',
      },
    ],
  },
  {
    label: t('crossings.title', 2),
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
        label: t('motherPlants.title', 2),
        to: '/mother-plants',
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
        label: t('pollen.title', 2),
        to: '/pollen',
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
        label: t('attributions.title', 2),
        icon: 'star',
        to: '/attributions',
      },
      {
        label: t('nav.more.attributionForms.main'),
        icon: 'form',
        to: 'attribution',
        children: [
          {
            label: t('nav.more.attributionForms.forms'),
            to: '/attribution-forms',
          },
          {
            label: t('nav.more.attributionForms.attributes'),
            to: '/attributes',
          },
        ],
      },
      {
        label: t('plantRows.title', 2),
        icon: 'rows',
        to: '/rows',
      },
      {
        label: t('orchards.title', 2),
        icon: 'orchard',
        to: '/orchards',
      },
      {
        label: t('rootstocks.title', 2),
        icon: 'rootstock',
        to: '/rootstocks',
      },
      {
        label: t('graftings.title', 2),
        icon: 'grafting',
        to: '/graftings',
      },
      {
        label: t('users.title', 2),
        icon: 'user',
        to: '/users',
      },
      {
        label: t('nav.more.settings'),
        icon: 'settings',
        to: '/settings',
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
        to: '/sign-out',
      },
    ],
  },
];

function setPaths(
  items: NavDefinitionItem[],
  parentPath: string,
  navPath: string[],
) {
  return items.map((item) => {
    const newItem = { ...item } as NavItem;
    newItem.path = item.to
      ? item.to.startsWith('/')
        ? item.to
        : `${parentPath}/${item.to}`
      : `${parentPath}`;
    newItem.navPath = navPath;
    newItem.children = item.children
      ? setPaths(item.children, newItem.path, [...navPath, newItem.path])
      : [];
    return newItem;
  });
}

const navItems = setPaths(navDefinition, '', []);
</script>
