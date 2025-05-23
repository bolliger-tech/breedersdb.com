<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.email = el)"
    v-model="data.email"
    :label="t('users.fields.email')"
    :rules="[
      (val: string | null | undefined) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('users.fields.email') }),
      (val: string) =>
        val.length <= 254 || t('base.validation.maxLen', { x: 254 }), // https://stackoverflow.com/a/574698
      (val: string) => isValidEmail(val) || t('users.validation.invalidEmail'),
      async (val: string) =>
        (await isEmailUnique(val)) || t('users.validation.emailNotUnique'),
    ]"
    type="email"
    autocomplete="off"
    debounce="300"
    :loading="fetchingEmailUnique"
    required
    trim
  />
  <EntitySelect
    :ref="(el: InputRef) => (refs.locale = el)"
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
  <EntityInputPassword
    v-if="!('id' in props.user)"
    :ref="(el: InputRef) => (refs.password = el)"
    v-model="data.password"
    :label="t('users.fields.password')"
    autocomplete="off"
    required
    :rules="[
      (val: string | null | undefined) =>
        (!!val && isValidPassword(val)) ||
        t('users.validation.invalidPassword'),
    ]"
  />
  <template v-else>
    <UserButtonChangePassword :user-id="props.user.id" />
  </template>
</template>

<script setup lang="ts">
import type { LocaleOption } from 'src/composables/useI18n';
import { getLocaleOptions, useI18n } from 'src/composables/useI18n';
import { DEFAULT_LOCALE } from 'src/i18n';
import { ref, watch } from 'vue';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import EntitySelect from 'src/components/Entity/Edit/EntitySelect.vue';
import EntityInputPassword from 'src/components/Entity/Edit/EntityInputPassword.vue';
import { makeModalPersistentSymbol } from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import type { UserModalEditProps } from './UserModalEdit.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { isValidEmail } from 'src/utils/validationUtils';
import UserButtonChangePassword from './UserButtonChangePassword.vue';
import { isValidPassword } from 'src/utils/validationUtils';
import { useIsUnique } from 'src/composables/useIsUnique';

export interface UserEntityFormProps {
  user: UserModalEditProps['user'];
}

const props = defineProps<UserEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  email: props.user.email,
  locale: props.user.locale,
  password: undefined,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  email: null,
  locale: null,
  password: null,
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

const { t } = useI18n();
const localeOptions = getLocaleOptions(t);

const { isUnique: isEmailUnique, fetching: fetchingEmailUnique } = useIsUnique({
  tableName: 'users',
  existingId: ('id' in props.user && props.user.id) || undefined,
  columnName: 'email',
});
</script>
