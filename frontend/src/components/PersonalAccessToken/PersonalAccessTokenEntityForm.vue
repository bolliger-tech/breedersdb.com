<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string | null | undefined) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      (val: string) =>
        /^[^\n]{1,120}$/.test(val) ||
        t('base.validation.noNewLinesMaxLength', { max: 120 }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    required
    trim
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.expires = el)"
    v-model="data.expires"
    :label="t('personalAccessTokens.fields.expires')"
    type="datetime-local"
    :rules="[
      (v: string | null | undefined | Date) =>
        !v || futureDateValidationRule(v),
    ]"
    autocomplete="off"
    :hint="t('personalAccessTokens.expiresHint')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import { useValidationRule } from 'src/composables/useValidationRule';
import type { PersonalAccessTokenModalEditProps } from './PersonalAccessTokenModalEdit.vue';
import { useMe } from 'src/composables/useMe';

export interface PersonalAccessTokenEntityFormProps {
  personalAccessToken: PersonalAccessTokenModalEditProps['personalAccessToken'];
}

const props = defineProps<PersonalAccessTokenEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.personalAccessToken.name || '',
  expires: props.personalAccessToken.expires,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  expires: null,
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

const me = useMe();

const additionalWhere = computed(() => {
  if (!me.value?.id) {
    return {};
  }
  return {
    user_id: { _eq: me.value.id },
  };
});

const { isUnique: isNameUnique, fetching: fetchingNameUnique } = useIsUnique({
  tableName: 'user_tokens',
  existingId:
    ('id' in props.personalAccessToken && props.personalAccessToken.id) ||
    undefined,
  additionalWhere,
});

const { t } = useI18n();
const { makeDateValidationRule } = useValidationRule();

function futureDateValidationRule(value: string | null | undefined | Date) {
  const now = new Date();
  const min = new Date(now);
  min.setHours(0, 0, 0, 0);
  const max = new Date(now);
  max.setFullYear(now.getFullYear() + 10);
  return makeDateValidationRule({
    min,
    max,
  })(value);
}
</script>
