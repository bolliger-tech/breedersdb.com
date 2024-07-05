import { computed, type Ref, type VNodeRef } from 'vue';

export type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
export function useEntityForm<T extends Record<string, unknown>>({
  refs,
  data,
  initialData,
}: {
  refs: Ref<{
    [key: string]: InputRef | null;
  }>;
  data: Ref<T>;
  initialData: T;
}) {
  const isDirty = computed(() => {
    return (Object.keys(initialData) as (keyof typeof initialData)[]).some(
      (key) => data.value[key] !== initialData[key],
    );
  });

  async function validate() {
    const validated = await Promise.all(
      Object.values(refs.value).map((ref) => ({
        ref,
        valid: ref?.validate?.() ?? true,
      })),
    );

    if (validated.every((input) => input.valid)) {
      // all are valid
      return true;
    }

    // focus first invalid
    validated.find((input) => !input.valid)?.ref?.focus();

    return false;
  }

  return {
    isDirty,
    validate,
  };
}
