<template>
  <q-input
    ref="labelIdRef"
    v-model="labelId"
    :label="t('plants.fields.labelId')"
    :bg-color="inputBgColor"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('plants.fields.labelId') }),
      (val: string) =>
        (/^#?[0-9]{1,8}$/.test(val) && parseInt(val.replace(/^#/, '')) > 0) ||
        t('plants.errors.labelId'),
    ]"
    type="text"
    autocomplete="off"
    dense
    outlined
  />

  <PlantPlantGroupSelect ref="plantGroupRef" v-model="plantGroup" />
  <PlantPlantRowSelect ref="plantRowRef" v-model="plantRow" />

  <!-- remove -->
  <q-btn label="Validate" color="primary" @click="validate" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantFragment } from './plantFragment';
import { useInputBackground } from 'src/composables/useInputBackground';
import { ref } from 'vue';
import { QInput } from 'quasar';
import PlantPlantGroupSelect from './PlantPlantGroupSelect.vue';
import PlantPlantRowSelect from './PlantPlantRowSelect.vue';

export interface PlantEntityTableProps {
  plant?: PlantFragment;
}

const props = defineProps<PlantEntityTableProps>();

const { t } = useI18n();
const { inputBgColor } = useInputBackground();

const labelIdRef = ref<QInput | null>(null);
const labelId = ref<string>(props.plant?.label_id ?? '');

const plantGroupRef = ref<InstanceType<typeof PlantPlantGroupSelect> | null>(
  null,
);
const plantGroup = ref<{ id: number; display_name: string } | undefined>(
  props.plant?.plant_group,
);

const plantRowRef = ref<InstanceType<typeof PlantPlantRowSelect> | null>(null);
const plantRow = ref<{ id: number; name: string } | undefined>(
  props.plant?.plant_row || undefined,
);

function validate() {
  labelIdRef.value?.validate();
  plantGroupRef.value?.validate();
  plantRowRef.value?.validate();
}
</script>
