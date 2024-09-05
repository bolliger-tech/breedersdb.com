import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { NavItem } from './TheNav.vue';

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
    if (
      item.path === route.path ||
      (route.meta.navPaths as string[] | undefined)?.includes(item.path)
    ) {
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
