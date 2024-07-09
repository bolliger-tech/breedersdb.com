<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.emailRef = el)"
    v-model="data.email"
    :label="t('users.fields.email')"
    :rules="[
      (val: string) => isValidEmail(val) || t('base.validation.invalidEmail'),
      async (val: string) =>
        (await isEmailUnique(val)) || t('base.validation.emailNotUnique'),
    ]"
    type="email"
    autocomplete="off"
    debounce="300"
    :loading="fetchingEmailUnique"
    required
  />
  <EntitySelect
    :ref="(el: InputRef) => (refs.localeRef = el)"
    :model-value="
      data.locale
        ? ({
            value: data.locale,
            label: localeOptions.find((o) => o.value === data.locale)?.label,
          } as LocaleOption)
        : null
    "
    :label="t('users.fields.locale')"
    :options="localeOptions"
    option-value="value"
    option-label="label"
    :clearable="false"
    required
    @update:model-value="
      (option: LocaleOption | null | undefined) =>
        (data.locale = option ? option.value : DEFAULT_LOCALE)
    "
  />
  <EntityInput
    v-if="!('id' in props.user)"
    :ref="(el: InputRef) => (refs.passwordRef = el)"
    v-model="data.password"
    :label="t('users.fields.password')"
    type="password"
    autocomplete="off"
    required
    :rules="[
      (val: string) =>
        !!isValidPassword(val) || t('base.validation.invalidPassword'),
    ]"
  />
  <template v-else>
    <UserButtonChangePassword :user-id="props.user.id" />
  </template>
</template>

<script setup lang="ts">
import {
  LocaleOption,
  getLocaleOptions,
  useI18n,
} from 'src/composables/useI18n';
import { DEFAULT_LOCALE } from 'src/i18n';
import { VNodeRef, nextTick, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { UserEditInput, UserInsertInput } from './UserModalEdit.vue';
import { useEntityForm } from 'src/composables/useEntityForm';
import { isValidEmail } from 'src/utils/validationUtils';
import UserButtonChangePassword from './UserButtonChangePassword.vue';
import { isValidPassword } from 'src/utils/validationUtils';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';

export interface UserEntityFormProps {
  user: UserInsertInput | UserEditInput;
}

const props = defineProps<UserEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();

const { t } = useI18n();

const initialData = {
  email: props.user.email as string,
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

const { isDirty, validate } = useEntityForm({
  refs,
  data,
  initialData,
});

defineExpose({ validate });

const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
watch(isDirty, () => makeModalPersistent(isDirty.value));

watch(data, (newData) => emits('change', newData), { deep: true });

const localeOptions = getLocaleOptions(t);

const emailUniqueQuery = graphql(`
  query EmailUniqueQuery($email: citext!) {
    users(where: { email: { _eq: $email } }, limit: 1) {
      id
    }
  }
`);

const queryVariables = ref({ email: data.value.email });

const { executeQuery: executeEmailUniqueQuery, fetching: fetchingEmailUnique } =
  useQuery({
    query: emailUniqueQuery,
    variables: queryVariables,
  });

async function isEmailUnique(newEmail: string) {
  // 😵🔫
  queryVariables.value.email = newEmail;
  await nextTick(); // wait for the refs to be updated
  const result = await executeEmailUniqueQuery();
  if (result.error.value) {
    console.error(result.error);
    return true;
  }
  // @ts-expect-error id only availabe on add
  const userId = props.user.id as number | undefined;
  return (
    result.data?.value?.users.length === 0 ||
    result.data?.value?.users[0]?.id === userId
  );
}
</script>
