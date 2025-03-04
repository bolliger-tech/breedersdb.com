import { ref, watch, type UnwrapRef, onMounted } from 'vue';
import {
  useRoute,
  useRouter,
  type LocationQueryValue,
  type LocationQuery,
} from 'vue-router';

// To prevent race conditions of multiple simultanious useQueryArg calls,
// we store the pending query args in this variable. Else they overwrite each
// other (at least in chrome).
// (It seems like chrome writes them asynchronously to the url)
let pendingQueryArgs: LocationQuery = {};

export function useQueryArg<
  T extends string | string[] | number | number[] | boolean | boolean[],
>({
  key,
  defaultValue,
  replace = false,
  showDefaultInUrl = false,
}: {
  key: string;
  defaultValue: T;
  replace?: boolean;
  showDefaultInUrl?: boolean;
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

  async function syncToRoute(arg: UnwrapRef<T>, replace: boolean) {
    const stringified = Array.isArray(arg)
      ? arg.map((v) => v.toString())
      : arg.toString();

    pendingQueryArgs = {
      ...route.query,
      ...pendingQueryArgs,
      [key]: stringified,
    };

    await router.push({ query: pendingQueryArgs, replace });
    pendingQueryArgs = {};
  }

  watch(queryArg, (value) => syncToRoute(value, replace));
  onMounted(async () => {
    if (showDefaultInUrl) {
      await syncToRoute(queryArg.value, true);
    }
  });

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
