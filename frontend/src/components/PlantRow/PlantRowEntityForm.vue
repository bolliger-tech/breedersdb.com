<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
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
    required
  />
  <OrchardSelect
    :ref="(el: InputRef) => (refs.orchardId = el)"
    v-model="data.orchard_id"
    :include-id="props.plantRow.orchard_id"
    :required="true"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateEliminated = el)"
    v-model="data.date_eliminated"
    :label="t('plantRows.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      data.date_eliminated
        ? t('plantRows.hints.dateEliminatedFalse')
        : t('plantRows.hints.dateEliminatedTrue')
    "
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
  PlantRowEditInput,
  PlantRowInsertInput,
} from './PlantRowModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import OrchardSelect from '../Orchard/OrchardSelect.vue';
import { useIsUnique } from 'src/composables/useIsUnique';

export interface PlantRowEntityFormProps {
  plantRow: PlantRowInsertInput | PlantRowEditInput;
}

const props = defineProps<PlantRowEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.plantRow.name,
  orchard_id: props.plantRow.orchard_id || null,
  date_eliminated: props.plantRow.date_eliminated,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  orchardId: null,
  dateEliminated: null,
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
  tableName: 'plant_rows',
  existingId: ('id' in props.plantRow && props.plantRow.id) || undefined,
});
</script>
