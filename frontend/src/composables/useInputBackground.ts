import { useQuasar } from 'quasar';
import { computed } from 'vue';

export function useInputBackground() {
  const $q = useQuasar();

  const inputBgColor = computed(() => {
    return $q.dark.isActive ? 'grey-7' : 'grey-1';
  });

  return {
    inputBgColor,
  };
}
