<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      (val: string) => {
        const regex = new RegExp('^[^\\n]{1,45}$');
        return (
          regex.test(val) ||
          t('base.validation.noNewLinesMaxLength', { maxLength: 45 })
        );
      },
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    :required="true"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.cultivarId = el)"
    v-model="data.cultivar_id"
    :required="true"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateHarvested = el)"
    v-model="data.date_harvested"
    :label="t('pollen.fields.dateHarvested')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.note = el)"
    v-model="data.note"
    :label="t('entity.commonColumns.note')"
    type="textarea"
    autocomplete="off"
    autogrow
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { PollenEditInput, PollenInsertInput } from './PollenModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import CultivarSelect from '../Cultivar/CultivarSelect.vue';

export interface PollenEntityFormProps {
  pollen: PollenInsertInput | PollenEditInput;
}

const props = defineProps<PollenEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.pollen.name,
  cultivar_id: props.pollen.cultivar_id || null,
  date_harvested: props.pollen.date_harvested,
  note: props.pollen.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  cultivarId: null,
  dateHarvested: null,
  note: null,
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

const { isUnique: isNameUnique, fetching: fetchingNameUnique } = useIsUnique({
  tableName: 'pollen',
  existingId: ('id' in props.pollen && props.pollen.id) || undefined,
});
</script>
