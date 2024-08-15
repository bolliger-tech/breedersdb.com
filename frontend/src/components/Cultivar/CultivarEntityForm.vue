<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameSegmentRef = el)"
    v-model="data.name_segment"
    :label="t('entity.commonColumns.nameSegment')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', {
          x: t('entity.commonColumns.nameSegment'),
        }),
      (val: string) => {
        const regex = new RegExp('^[-_\\w\\d]{1,25}$');
        return regex.test(val) || t('cultivars.validation.nameSegmentInvalid');
      },
      async (val: string) =>
        (await isNameSegmentUnique(val)) ||
        t('cultivars.validation.nameNotUniqueWithLot'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameSegmentUnique"
    required
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.nameOverrideRef = el)"
    v-model="data.name_override"
    :label="t('entity.commonColumns.nameOverride')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', {
          x: t('entity.commonColumns.nameOverride'),
        }),
      (val: string) => {
        const regex = new RegExp('^[^\\n\\.]{1,51}$');
        return regex.test(val) || t('cultivars.validation.nameOverrideInvalid');
      },
      async (val: string) =>
        (await isNameOverrideUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameOverrideUnique"
  />
  <LotSelect
    :ref="(el: InputRef) => (refs.lotRef = el)"
    v-model="data.lot_id"
    :required="true"
    @update:model-value="() => refs.nameSegmentRef?.validate()"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.acronymRef = el)"
    v-model="data.acronym"
    :label="t('cultivars.fields.acronym')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.breederRef = el)"
    v-model="data.breeder"
    :label="t('cultivars.fields.breeder')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.registrationRef = el)"
    v-model="data.registration"
    :label="t('cultivars.fields.registration')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.noteRef = el)"
    v-model="data.note"
    :label="t('entity.commonColumns.note')"
    type="textarea"
    autocomplete="off"
    autogrow
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  CultivarEditInput,
  CultivarInsertInput,
} from './CultivarModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import LotSelect from '../Lot/LotSelect.vue';

export interface CultivarEntityFormProps {
  cultivar: CultivarInsertInput | CultivarEditInput;
}

const props = defineProps<CultivarEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  ...props.cultivar,
  created: undefined,
  modified: undefined,
  id: undefined,
  __typename: undefined,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameSegmentRef: null,
  nameOverrideRef: null,
  lotRef: null,
  acronymRef: null,
  breederRef: null,
  registrationRef: null,
  noteRef: null,
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

const additionalWhere = computed(() => {
  if (!data.value.lot_id) {
    return {};
  }
  return {
    lot_id: { _eq: data.value.lot_id },
  };
});

const { isUnique: isNameSegmentUnique, fetching: fetchingNameSegmentUnique } =
  useIsUnique({
    tableName: 'cultivars',
    existingId: ('id' in props.cultivar && props.cultivar.id) || undefined,
    columnName: 'name_segment',
    additionalWhere,
  });

const { isUnique: isNameOverrideUnique, fetching: fetchingNameOverrideUnique } =
  useIsUnique({
    tableName: 'cultivars',
    existingId: ('id' in props.cultivar && props.cultivar.id) || undefined,
    columnName: 'name_override',
  });
</script>
