<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.motherCultivarRef = el)"
    v-model="data.mother_cultivar_id"
    :label="t('crossings.fields.motherCultivar')"
    :include-id="props.crossing.mother_cultivar_id || undefined"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.fatherCultivarRef = el)"
    v-model="data.father_cultivar_id"
    :label="t('crossings.fields.fatherCultivar')"
    :include-id="props.crossing.father_cultivar_id || undefined"
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
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  CrossingEditInput,
  CrossingInsertInput,
} from './CrossingModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import CultivarSelect from '../Cultivar/CultivarSelect.vue';

export interface CrossingEntityFormProps {
  crossing: CrossingInsertInput | CrossingEditInput;
}

const props = defineProps<CrossingEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  ...props.crossing,
  created: undefined,
  modified: undefined,
  id: undefined,
  __typename: undefined,
  mother_cultivar_id: props.crossing.mother_cultivar_id || null,
  father_cultivar_id: props.crossing.father_cultivar_id || null,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
  motherCultivarRef: null,
  fatherCultivarRef: null,
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

const { isUnique: isNameUnique, fetching: fetchingNameUnique } = useIsUnique({
  tableName: 'crossings',
  existingId: ('id' in props.crossing && props.crossing.id) || undefined,
});
</script>
