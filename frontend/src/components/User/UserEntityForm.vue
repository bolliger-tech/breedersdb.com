<template>
  <!-- TODO: email validation-->
  <EntityInput
    :ref="(el: InputRef) => (refs.emailRef = el)"
    v-model="data.email as string"
    :label="t('users.fields.email')"
    type="email"
    autocomplete="off"
  />
  <!-- TODO: select instead of input -->
  <EntityInput
    :ref="(el: InputRef) => (refs.localeRef = el)"
    v-model="data.locale"
    :label="t('users.fields.locale')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    v-if="!('id' in props.user)"
    :ref="(el: InputRef) => (refs.passwordRef = el)"
    v-model="data.password"
    :label="t('users.fields.password')"
    type="password"
    autocomplete="off"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { VNodeRef, computed, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { UserEditInput, UserInsertInput } from './UserModalEdit.vue';

export interface UserEntityFormProps {
  user: UserInsertInput | UserEditInput;
}

const props = defineProps<UserEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
defineExpose({ validate });

const { t } = useI18n();

const initialData = {
  email: props.user.email,
  locale: props.user.locale,
  password: null,
};

const data = ref({ ...initialData });

type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
const refs = ref<{ [key: string]: InputRef | null }>({
  emailRef: null,
  localeRef: null,
  passwordRef: null,
});

const isDirty = computed(() => {
  return (Object.keys(initialData) as (keyof typeof initialData)[]).some(
    (key) => data.value[key] !== initialData[key],
  );
});
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
watch(isDirty, () => makeModalPersistent(isDirty.value));

watch(data, (newData) => emits('change', newData), { deep: true });

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
</script>
