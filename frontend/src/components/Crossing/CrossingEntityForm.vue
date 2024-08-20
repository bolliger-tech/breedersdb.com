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
        const regex = new RegExp('^[-_\\w\\d]{1,8}$');
        return (
          regex.test(val) ||
          t('base.validation.noSpecialCharsMaxLength', { max: 8 })
        );
      },
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    required
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.motherCultivarId = el)"
    v-model="data.mother_cultivar_id"
    :label="t('crossings.fields.motherCultivar')"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.fatherCultivarId = el)"
    v-model="data.father_cultivar_id"
    :label="t('crossings.fields.fatherCultivar')"
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
  name: props.crossing.name,
  mother_cultivar_id: props.crossing.mother_cultivar_id || null,
  father_cultivar_id: props.crossing.father_cultivar_id || null,
  note: props.crossing.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  motherCultivarId: null,
  fatherCultivarId: null,
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
  tableName: 'crossings',
  existingId: ('id' in props.crossing && props.crossing.id) || undefined,
});
</script>
