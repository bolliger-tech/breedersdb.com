import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useNavItem<T extends { to: string }>({
  children,
  to,
}: {
  children?: T[];
  to: string;
}) {
  const hasChildren = computed(() => children && children.length > 0);

  const getChildren = computed(() => {
    return (
      children?.map((child) => ({
        ...child,
        to: child.to
          ? child.to.startsWith('/')
            ? child.to
            : `${to}/${child.to}`
          : `${to}`,
      })) || []
    );
  });

  const route = useRoute();
  const currentRouteRegex = computed(() => {
    if (hasChildren.value) {
      return new RegExp(`^${to}(/|$)`);
    }
    return new RegExp(`^${to}/?$`);
  });
  const isCurrentRoute = computed(() =>
    currentRouteRegex.value.test(route.path),
  );

  return {
    hasChildren,
    getChildren,
    isCurrentRoute,
  };
}
