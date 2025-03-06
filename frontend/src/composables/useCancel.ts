import { useRoute, useRouter } from 'vue-router';

export function useCancel({ path }: { path: string }) {
  const router = useRouter();
  const route = useRoute();

  async function cancel() {
    const last = router.options.history.state.back;
    const isNewOrEdit = /\/(edit|new)(\/\d*)?$/;
    if (typeof last === 'string' && !isNewOrEdit.test(last)) {
      router.back();
    } else {
      await router.push({ path, query: route.query });
    }
  }

  return { cancel };
}
