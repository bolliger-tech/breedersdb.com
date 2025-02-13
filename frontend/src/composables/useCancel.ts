import { useRoute, useRouter } from 'vue-router';

export function useCancel({ path }: { path: string }) {
  const router = useRouter();
  const route = useRoute();

  function cancel() {
    const last = router.options.history.state.back;
    const isNewOrEdit = /\/(edit|new)(\/\d*)?$/;
    if (!!last && !isNewOrEdit.test(last.toString())) {
      router.back();
    } else {
      router.push({ path, query: route.query });
    }
  }

  return { cancel };
}
