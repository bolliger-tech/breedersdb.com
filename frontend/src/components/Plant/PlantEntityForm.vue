<template>
  <PlantLabelIdEdit
    :ref="() => refs.labelIdRef"
    v-model="data.labelId"
    :eliminated="!!data.dateEliminated"
  />
  <PlantPlantGroupSelect
    :ref="() => refs.plantGroupRef"
    v-model="data.plantGroup"
  />
  <PlantPlantRowSelect :ref="() => refs.plantRowRef" v-model="data.plantRow" />
  <EntityInput
    :ref="() => refs.distancePlantRowStartRef"
    v-model="data.distancePlantRowStart"
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
    v-model="data.dateGrafted"
    :label="t('plants.fields.dateGrafted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="() => refs.datePlantedRef"
    v-model="data.datePlanted"
    :label="t('plants.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="() => refs.dateEliminatedRef"
    v-model="data.dateEliminated"
    :label="t('plants.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      data.dateEliminated
        ? t('plants.hints.dateEliminatedTrue')
        : t('plants.hints.dateEliminatedFalse')
    "
  />
  <EntityInput
    :ref="() => refs.dateLabeledRef"
    v-model="data.dateLabeled"
    :label="t('plants.fields.dateLabeled')"
    type="date"
    autocomplete="off"
  />
  <PlantRootstockSelect
    :ref="() => refs.rootstockRef"
    v-model="data.rootstock"
  />
  <PlantGraftingSelect :ref="() => refs.graftingRef" v-model="data.grafting" />
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
  plant?: PlantFragment;
}

const props = defineProps<PlantEntityTableProps>();

const { t } = useI18n();

const initialData = {
  labelId: props.plant?.label_id ?? '',
  plantGroup: props.plant?.plant_group,
  plantRow: props.plant?.plant_row,
  distancePlantRowStart: props.plant?.distance_plant_row_start,
  dateGrafted: props.plant?.date_grafted,
  datePlanted: props.plant?.date_planted,
  dateEliminated: props.plant?.date_eliminated,
  dateLabeled: props.plant?.date_labeled,
  rootstock: props.plant?.rootstock,
  grafting: props.plant?.grafting,
};

const data = ref({ ...initialData });

watch(
  () => data.value.dateEliminated,
  (eliminated) => {
    const nonPrefixedLabelId = data.value.labelId.replace('#', '');
    data.value.labelId = eliminated
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
</script>
