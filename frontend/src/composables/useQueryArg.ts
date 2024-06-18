import { ref, watch, type UnwrapRef } from 'vue';
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router';

export function useQueryArg<
  T extends string | string[] | number | number[] | boolean | boolean[],
>({
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

  function castToDefaultValueType(
    value: LocationQueryValue | LocationQueryValue[],
  ): T | undefined {
    if (value === undefined) {
      // not in url
      return undefined;
    }

    if (Array.isArray(defaultValue) && !Array.isArray(value)) {
      value = [value];
    }

    return Array.isArray(value)
      ? (value
          .map((v) => toDefaultValueTypeSingle(v))
          .filter((v) => v !== undefined) as T | undefined)
      : (toDefaultValueTypeSingle(value) as T | undefined);
  }

  function toDefaultValueTypeSingle(value: LocationQueryValue) {
    if (value === null || value === undefined) {
      return undefined;
    }
    switch (typeof defaultValue) {
      case 'undefined':
        return undefined;
      case 'number':
        return Number.isInteger(defaultValue)
          ? parseInt(value.toString(), 10)
          : parseFloat(value.toString());
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }

  const queryArg = ref(
    castToDefaultValueType(route.query[key]) ?? defaultValue,
  );

  function syncToRoute(arg: UnwrapRef<T>) {
    const stringified = Array.isArray(arg)
      ? arg.map((v) => v.toString())
      : arg.toString();

    const query = {
      ...route.query,
      [key]: stringified,
    };

    router.push({ query, replace });
  }

  watch(queryArg, (value) => syncToRoute(value));

  watch(route, (value) => {
    const converted = castToDefaultValueType(value.query[key]);
    queryArg.value = (
      typeof converted === 'undefined' ? defaultValue : converted
    ) as UnwrapRef<T>;
  });

  return {
    queryArg,
  };
}
