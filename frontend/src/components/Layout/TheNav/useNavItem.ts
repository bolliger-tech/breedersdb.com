import { computed, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { type BaseSpriteIconProps } from 'components/Base/BaseSpriteIcon/baseSpriteIconProps';

export type NavItem = {
  to: string;
  path: string;
  navPath: string[];
  isOpen?: boolean;
  children?: NavItem[];
  component?: { component: Component; props?: Record<string, unknown> };
  label?: string;
  icon?: BaseSpriteIconProps['name'];
  isCurrentRoute?: boolean;
} & Omit<BaseSpriteIconProps, 'name'>;

export function useNavItem(item: NavItem) {
  const route = useRoute();

  function itemChildrenToFlatList(item: NavItem): NavItem[] {
    return item.children
      ? item.children.reduce((acc, item) => {
          return [...acc, item, ...itemChildrenToFlatList(item)];
        }, [] as NavItem[])
      : [];
  }

  const isActiveRoute = computed(() => {
    if (item.path === route.path) {
      return true;
    }

    const activeItem = itemChildrenToFlatList(item).find(
      (item) =>
        item.path === route.path ||
        (route.meta.navPaths as string[] | undefined)?.includes(item.path),
    );

    return activeItem?.navPath.includes(item.path) || false;
  });

  return {
    isCurrentRoute: isActiveRoute,
  };
}
