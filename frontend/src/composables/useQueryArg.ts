import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQueryArg<T extends string | number | boolean>({
  key,
  defaultValue,
  replace = false,
}: {
  key: string;
  defaultValue: T;
  replace?: boolean;
}) {
  const route = useRoute();
  const router = useRouter();

  function toDefaultValueType(value: string | undefined): T | undefined {
    if (typeof defaultValue === 'undefined') {
      return undefined;
    }

    if (typeof defaultValue === 'number' && Number.isInteger(defaultValue)) {
      return value ? (parseInt(value, 10) as unknown as T) : defaultValue;
    }

    if (typeof defaultValue === 'number') {
      return value ? (parseFloat(value) as unknown as T) : defaultValue;
    }

    if (typeof defaultValue === 'boolean') {
      return value ? ((value === 'true') as unknown as T) : defaultValue;
    }

    return value as unknown as T;
  }

  const queryArg = ref(
    toDefaultValueType(route.query[key]?.toString()) || defaultValue,
  );

  watch(queryArg, (value) => {
    const query = {
      ...route.query,
      [key]: value.toString(),
    };

    router.push({ query, replace });
  });

  return {
    queryArg,
  };
}
