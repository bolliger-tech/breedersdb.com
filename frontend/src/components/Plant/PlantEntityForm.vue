<template>
  <PlantLabelIdEdit
    :ref="() => refs.labelIdRef"
    v-model="data.label_id"
    :eliminated="!!data.date_eliminated"
  />
  <PlantPlantGroupSelect
    :ref="() => refs.plantGroupRef"
    v-model="data.plant_group_id"
  />
  <PlantPlantRowSelect
    :ref="() => refs.plantRowRef"
    v-model="data.plant_row_id"
  />
  <EntityInput
    :ref="() => refs.distancePlantRowStartRef"
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
    :ref="() => refs.dateGraftedRef"
    v-model="data.date_grafted"
    :label="t('plants.fields.dateGrafted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="() => refs.datePlantedRef"
    v-model="data.date_planted"
    :label="t('plants.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="() => refs.dateEliminatedRef"
    v-model="data.date_eliminated"
    :label="t('plants.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      data.date_eliminated
        ? t('plants.hints.dateEliminatedTrue')
        : t('plants.hints.dateEliminatedFalse')
    "
  />
  <EntityInput
    :ref="() => refs.dateLabeledRef"
    v-model="data.date_labeled"
    :label="t('plants.fields.dateLabeled')"
    type="date"
    autocomplete="off"
  />
  <PlantRootstockSelect
    :ref="() => refs.rootstockRef"
    v-model="data.rootstock_id"
  />
  <PlantGraftingSelect
    :ref="() => refs.graftingRef"
    v-model="data.grafting_id"
  />
  <!-- remove -->
  <q-btn label="Validate" color="primary" @click="validate" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantFragment } from './plantFragment';
import { VNodeRef, computed, inject, ref } from 'vue';
import PlantPlantGroupSelect from './PlantPlantGroupSelect.vue';
import PlantPlantRowSelect from './PlantPlantRowSelect.vue';
import PlantLabelIdEdit from './PlantLabelIdEdit.vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import PlantRootstockSelect from './PlantRootstockSelect.vue';
import PlantGraftingSelect from './PlantGraftingSelect.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/makeModalPersistent';

export interface PlantEntityTableProps {
  plant: PlantFragment;
}

const props = defineProps<PlantEntityTableProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();

const { t } = useI18n();

const initialData = {
  label_id: props.plant.label_id,
  plant_group_id: props.plant.plant_group?.id || null,
  plant_row_id: props.plant.plant_row?.id || null,
  distance_plant_row_start: props.plant.distance_plant_row_start,
  date_grafted: props.plant.date_grafted,
  date_planted: props.plant.date_planted,
  date_eliminated: props.plant.date_eliminated,
  date_labeled: props.plant.date_labeled,
  rootstock_id: props.plant.rootstock?.id || null,
  grafting_id: props.plant.grafting?.id || null,
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
});

function validate() {
  for (const key in refs.value) {
    refs.value[key]?.validate();
  }
}

const isDirty = computed(() => {
  return (Object.keys(initialData) as (keyof typeof initialData)[]).some(
    (key) => data.value[key] !== initialData[key],
  );
});
const makeModalPersistent = inject(makeModalPersistentSymbol);
watch(isDirty, () => {
  if (makeModalPersistent) makeModalPersistent(isDirty.value);
});

watch(data, (newData) => emits('change', newData), { deep: true });
</script>
