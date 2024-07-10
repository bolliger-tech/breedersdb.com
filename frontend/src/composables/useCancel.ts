import { useRoute, useRouter } from 'vue-router';

export function useCancel({ path }: { path: string }) {
  const router = useRouter();
  const route = useRoute();

  function cancel() {
    const canGoBack = !!router.options.history.state.back;
    if (canGoBack) {
      router.back();
    } else {
      router.push({ path, query: route.query });
    }
  }

  return { cancel };
}
