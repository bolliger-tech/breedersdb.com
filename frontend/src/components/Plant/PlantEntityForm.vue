<template>
  <PlantLabelIdEdit
    ref="labelIdRef"
    v-model="labelId"
    :eliminated="!!dateEliminated"
  />
  <PlantPlantGroupSelect ref="plantGroupRef" v-model="plantGroup" />
  <PlantPlantRowSelect ref="plantRowRef" v-model="plantRow" />
  <EntityInput
    ref="distancePlantRowStartRef"
    v-model="distancePlantRowStart"
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
    ref="dateGraftedRef"
    v-model="dateGrafted"
    :label="t('plants.fields.dateGrafted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    ref="datePlantedRef"
    v-model="datePlanted"
    :label="t('plants.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    ref="dateEliminatedRef"
    v-model="dateEliminated"
    :label="t('plants.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      dateEliminated
        ? t('plants.hints.dateEliminatedTrue')
        : t('plants.hints.dateEliminatedFalse')
    "
  />
  <EntityInput
    ref="dateLabeledRef"
    v-model="dateLabeled"
    :label="t('plants.fields.dateLabeled')"
    type="date"
    autocomplete="off"
  />
  <PlantRootstockSelect ref="rootstockRef" v-model="rootstock" />
  <PlantGraftingSelect ref="graftingRef" v-model="grafting" />
  <!-- remove -->
  <q-btn label="Validate" color="primary" @click="validate" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantFragment } from './plantFragment';
import { ref } from 'vue';
import PlantPlantGroupSelect from './PlantPlantGroupSelect.vue';
import PlantPlantRowSelect from './PlantPlantRowSelect.vue';
import PlantLabelIdEdit from './PlantLabelIdEdit.vue';
import EntityInput, {
  EntityInputInstance,
} from '../Entity/Edit/EntityInput.vue';
import PlantRootstockSelect from './PlantRootstockSelect.vue';
import PlantGraftingSelect from './PlantGraftingSelect.vue';
import { watch } from 'vue';

export interface PlantEntityTableProps {
  plant?: PlantFragment;
}

const props = defineProps<PlantEntityTableProps>();

const { t } = useI18n();

const labelId = ref<string>(props.plant?.label_id ?? '');
const plantGroup = ref<{ id: number; display_name: string } | undefined>(
  props.plant?.plant_group,
);
const plantRow = ref<{ id: number; name: string } | undefined>(
  props.plant?.plant_row || undefined,
);
const distancePlantRowStart = ref<number | null | undefined>(
  props.plant?.distance_plant_row_start,
);
const dateGrafted = ref<string | null | undefined>(props.plant?.date_grafted);
const datePlanted = ref<string | null | undefined>(props.plant?.date_planted);
const dateEliminated = ref<string | null | undefined>(
  props.plant?.date_eliminated,
);
const dateLabeled = ref<string | null | undefined>(props.plant?.date_labeled);
const rootstock = ref<{ id: number; name: string } | undefined>(
  props.plant?.rootstock || undefined,
);
const grafting = ref<{ id: number; name: string } | undefined>(
  props.plant?.grafting || undefined,
);

const labelIdRef = ref<InstanceType<typeof PlantLabelIdEdit> | null>(null);
const plantGroupRef = ref<InstanceType<typeof PlantPlantGroupSelect> | null>(
  null,
);
const plantRowRef = ref<EntityInputInstance | null>(null);
const distancePlantRowStartRef = ref<EntityInputInstance | null>(null);
const dateGraftedRef = ref<EntityInputInstance | null>(null);
const datePlantedRef = ref<EntityInputInstance | null>(null);
const dateEliminatedRef = ref<EntityInputInstance | null>(null);
const dateLabeledRef = ref<EntityInputInstance | null>(null);
const rootstockRef = ref<InstanceType<typeof PlantRootstockSelect> | null>(
  null,
);
const graftingRef = ref<InstanceType<typeof PlantGraftingSelect> | null>(null);

watch(dateEliminated, (eliminated) => {
  const nonPrefixedLabelId = labelId.value.replace('#', '');
  labelId.value = eliminated ? `#${nonPrefixedLabelId}` : nonPrefixedLabelId;
});

function validate() {
  labelIdRef.value?.validate();
  plantGroupRef.value?.validate();
  plantRowRef.value?.validate();
  distancePlantRowStartRef.value?.validate();
  dateGraftedRef.value?.validate();
  datePlantedRef.value?.validate();
  dateEliminatedRef.value?.validate();
  dateLabeledRef.value?.validate();
  rootstockRef.value?.validate();
  graftingRef.value?.validate();
}
</script>
