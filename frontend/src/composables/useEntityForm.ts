import { computed, type Ref, type VNodeRef } from 'vue';
import { is } from 'quasar';

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
  const isDirty = computed(() => !is.deepEqual(data.value, initialData));

  async function validate() {
    const validated = await Promise.all(
      Object.values(refs.value).map(async (ref) => ({
        ref,
        valid: (await ref?.validate?.()) ?? true,
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
