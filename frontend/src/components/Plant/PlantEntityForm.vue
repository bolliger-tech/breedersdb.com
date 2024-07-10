<template>
  <PlantLabelIdEdit
    :ref="(el: InputRef) => (refs.labelIdRef = el)"
    v-model="data.label_id"
    :eliminated="!!data.date_eliminated"
    :stored-label-id="initialLabelId"
  />
  <PlantPlantGroupSelect
    :ref="(el: InputRef) => (refs.plantGroupRef = el)"
    v-model="data.plant_group_id"
  />
  <PlantPlantRowSelect
    :ref="(el: InputRef) => (refs.plantRowRef = el)"
    v-model="data.plant_row_id"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.distancePlantRowStartRef = el)"
    v-model="data.distance_plant_row_start"
    :label="t('plants.fields.distancePlantRowStart')"
    :rules="[
      (val: string) =>
        !val ||
        parseFloat(val) >= 0 ||
        t('plants.errors.distancePlantRowStart'),
    ]"
    type="number"
    autocomplete="off"
    step="0.01"
    :hint="t('plants.hints.distancePlantRowStart')"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateGraftedRef = el)"
    v-model="data.date_grafted"
    :label="t('plants.fields.dateGrafted')"
    type="date"
    autocomplete="off"
  />
  <PlantRootstockSelect
    :ref="(el: InputRef) => (refs.rootstockRef = el)"
    v-model="data.rootstock_id"
  />
  <PlantGraftingSelect
    :ref="(el: InputRef) => (refs.graftingRef = el)"
    v-model="data.grafting_id"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.datePlantedRef = el)"
    v-model="data.date_planted"
    :label="t('plants.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateLabeledRef = el)"
    v-model="data.date_labeled"
    :label="t('plants.fields.dateLabeled')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateEliminatedRef = el)"
    v-model="data.date_eliminated"
    :label="t('plants.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      data.date_eliminated
        ? t('plants.hints.dateEliminatedFalse')
        : t('plants.hints.dateEliminatedTrue')
    "
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.note = el)"
    v-model="data.note"
    :label="t('entity.commonColumns.note')"
    type="textarea"
    autocomplete="off"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { VNodeRef, ref } from 'vue';
import PlantPlantGroupSelect from './PlantPlantGroupSelect.vue';
import PlantPlantRowSelect from './PlantPlantRowSelect.vue';
import PlantLabelIdEdit from './PlantLabelIdEdit.vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import PlantRootstockSelect from './PlantRootstockSelect.vue';
import PlantGraftingSelect from './PlantGraftingSelect.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { PlantEditInput, PlantInsertInput } from './PlantModalEdit.vue';
import { useEntityForm } from 'src/composables/useEntityForm';

export interface PlantEntityFormProps {
  plant: PlantInsertInput | PlantEditInput;
}

const props = defineProps<PlantEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

// new plant has no label_id
const initialLabelId = 'label_id' in props.plant ? props.plant.label_id : '';

const initialData = {
  label_id: initialLabelId,
  plant_group_id: props.plant.plant_group?.id || null,
  plant_row_id: props.plant.plant_row?.id || null,
  distance_plant_row_start: props.plant.distance_plant_row_start,
  date_grafted: props.plant.date_grafted,
  date_planted: props.plant.date_planted,
  date_eliminated: props.plant.date_eliminated,
  date_labeled: props.plant.date_labeled,
  rootstock_id: props.plant.rootstock?.id || null,
  grafting_id: props.plant.grafting?.id || null,
  note: props.plant.note,
};

const data = ref({ ...initialData });

watch(
  () => data.value.date_eliminated,
  (eliminated) => {
    const nonPrefixedLabelId = data.value.label_id.replace('#', '');
    data.value.label_id = eliminated
      ? `#${nonPrefixedLabelId}`
      : nonPrefixedLabelId;
  },
);

type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
const refs = ref<{ [key: string]: InputRef | null }>({
  labelIdRef: null,
  plantGroupRef: null,
  plantRowRef: null,
  distancePlantRowStartRef: null,
  dateGraftedRef: null,
  datePlantedRef: null,
  dateEliminatedRef: null,
  dateLabeledRef: null,
  rootstockRef: null,
  graftingRef: null,
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
</script>
