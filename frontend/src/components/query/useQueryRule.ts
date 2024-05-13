import { useQuasar } from 'quasar';
import { computed } from 'vue';

export function useInputBackground() {
  const $q = useQuasar();

  return computed(() => {
    return $q.dark.isActive ? 'grey-7' : 'grey-1';
  });
}
