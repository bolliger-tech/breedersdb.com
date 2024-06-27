<template>
  <PlantLabelIdEdit ref="labelIdRef" v-model="labelId" />
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

  <!-- remove -->
  <q-btn label="Validate" color="primary" @click="validate" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantFragment } from './plantFragment';
import { ref } from 'vue';
import { QInput } from 'quasar';
import PlantPlantGroupSelect from './PlantPlantGroupSelect.vue';
import PlantPlantRowSelect from './PlantPlantRowSelect.vue';
import PlantLabelIdEdit from './PlantLabelIdEdit.vue';
import EntityInput, {
  EntityInputInstance,
} from '../Entity/Edit/EntityInput.vue';

export interface PlantEntityTableProps {
  plant?: PlantFragment;
}

const props = defineProps<PlantEntityTableProps>();

const { t } = useI18n();

const labelIdRef = ref<InstanceType<typeof PlantLabelIdEdit> | null>(null);
const labelId = ref<string>(props.plant?.label_id ?? '');

const plantGroupRef = ref<InstanceType<typeof PlantPlantGroupSelect> | null>(
  null,
);
const plantGroup = ref<{ id: number; display_name: string } | undefined>(
  props.plant?.plant_group,
);

const plantRowRef = ref<EntityInputInstance | null>(null);
const plantRow = ref<{ id: number; name: string } | undefined>(
  props.plant?.plant_row || undefined,
);

const distancePlantRowStartRef = ref<EntityInputInstance | null>(null);
const distancePlantRowStart = ref<number | null | undefined>(
  props.plant?.distance_plant_row_start,
);

const dateGraftedRef = ref<QInput | null>(null);
const dateGrafted = ref<string | null | undefined>(props.plant?.date_grafted);

function validate() {
  labelIdRef.value?.validate();
  plantGroupRef.value?.validate();
  plantRowRef.value?.validate();
  dateGraftedRef.value?.validate();
}
</script>
