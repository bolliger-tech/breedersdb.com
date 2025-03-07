<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      (val: string) =>
        /^[^\n]{1,45}$/.test(val) ||
        t('base.validation.noNewLinesMaxLength', { maxLength: 45 }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    required
    trim
  />
  <CrossingSelect
    :ref="(el: InputRef) => (refs.crossingId = el)"
    v-model="data.crossing_id"
    :include-id="data.crossing_id || undefined"
    :hint="
      selectedCrossing?.mother_cultivar
        ? t('motherPlants.hints.crossing', {
            motherCultivar: selectedCrossing.mother_cultivar.display_name,
            fatherCultivar:
              selectedCrossing.father_cultivar?.display_name || '–',
          })
        : undefined
    "
    required
    @crossing-changed="
      (c) => {
        selectedCrossing = c ? c : null;
        data.plant_id && refs.plantId?.validate();
        data.pollen_id && refs.pollenId?.validate();
      }
    "
  />
  <PlantSelect
    :ref="(el: InputRef) => (refs.plantId = el)"
    v-model="data.plant_id"
    :include-id="motherPlant.plant_id || undefined"
    required
    reject-eliminated
    :hint="
      selectedPlant
        ? t('motherPlants.hints.plantCultivar', {
            cultivar: selectedPlant.plant_group.cultivar.display_name,
          })
        : undefined
    "
    :rules="[
      (v: PlantSelectPlant | null | undefined) =>
        !v ||
        !selectedCrossing ||
        !selectedCrossing.mother_cultivar ||
        v.plant_group.cultivar.id === selectedCrossing.mother_cultivar.id ||
        t('motherPlants.crossingPlantCultivarMismatch', {
          plantCultivar: v.plant_group.cultivar.display_name,
          crossingMotherPlantCultivar:
            selectedCrossing.mother_cultivar.display_name,
        }),
    ]"
    @plant-changed="(p) => (selectedPlant = p ? p : null)"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateImpregnated = el)"
    v-model="data.date_impregnated"
    :label="t('motherPlants.fields.dateImpregnated')"
    type="date"
    :rules="[
      (v: string | null | undefined | Date) =>
        !v || defaultDateValidationRule(v),
    ]"
    autocomplete="off"
  />
  <PollenSelect
    :ref="(el: InputRef) => (refs.pollenId = el)"
    v-model="data.pollen_id"
    :hint="
      selectedPollen
        ? t('motherPlants.hints.pollenCultivar', {
            cultivar: selectedPollen.cultivar.display_name,
          })
        : undefined
    "
    :rules="[
      (v: PollenSelectPollen | null | undefined) =>
        !v ||
        !selectedCrossing ||
        !selectedCrossing.father_cultivar ||
        v.cultivar.id === selectedCrossing.father_cultivar.id ||
        t('motherPlants.crossingPollenCultivarMismatch', {
          pollenCultivar: v.cultivar.display_name,
          crossingFatherPlantCultivar:
            selectedCrossing.father_cultivar.display_name,
        }),
    ]"
    @pollen-changed="(p) => (selectedPollen = p ? p : null)"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbFlowers = el)"
    v-model="data.numb_flowers"
    :label="t('motherPlants.fields.numbFlowers')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbFruits = el)"
    v-model="data.numb_fruits"
    :label="t('motherPlants.fields.numbFruits')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | number | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateFruitsHarvested = el)"
    v-model="data.date_fruits_harvested"
    :label="t('motherPlants.fields.dateFruitsHarvested')"
    type="date"
    :rules="[
      (v: string | null | undefined | Date) =>
        !v || defaultDateValidationRule(v),
    ]"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeeds = el)"
    v-model="data.numb_seeds"
    :label="t('motherPlants.fields.numbSeeds')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | number | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.note = el)"
    v-model.trim="data.note"
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
import type { MotherPlantModalEditProps } from './MotherPlantModalEdit.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import type { PlantSelectPlant } from '../Plant/PlantSelect.vue';
import PlantSelect from '../Plant/PlantSelect.vue';
import type { PollenSelectPollen } from '../Pollen/PollenSelect.vue';
import PollenSelect from '../Pollen/PollenSelect.vue';
import type { CrossingSelectCrossing } from '../Crossing/CrossingSelect.vue';
import CrossingSelect from '../Crossing/CrossingSelect.vue';
import { useValidationRule } from 'src/composables/useValidationRule';

export interface MotherPlantEntityFormProps {
  motherPlant: MotherPlantModalEditProps['motherPlant'];
}

const props = defineProps<MotherPlantEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.motherPlant.name,
  crossing_id: props.motherPlant.crossing_id || null,
  plant_id: props.motherPlant.plant_id || null,
  date_impregnated: props.motherPlant.date_impregnated,
  pollen_id: props.motherPlant.pollen_id || null,
  numb_flowers: props.motherPlant.numb_flowers,
  numb_fruits: props.motherPlant.numb_fruits,
  date_fruits_harvested: props.motherPlant.date_fruits_harvested,
  numb_seeds: props.motherPlant.numb_seeds,
  note: props.motherPlant.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  crossingId: null,
  plantId: null,
  dateImpregnated: null,
  pollenId: null,
  numbFlowers: null,
  numbFruits: null,
  dateFruitsHarvested: null,
  numbSeeds: null,
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
  tableName: 'mother_plants',
  existingId: ('id' in props.motherPlant && props.motherPlant.id) || undefined,
});

const selectedPlant = ref<PlantSelectPlant | null>(null);
const selectedCrossing = ref<CrossingSelectCrossing | null>(null);
const selectedPollen = ref<PollenSelectPollen | null>(null);

const { isPositiveIntegerRule, defaultDateValidationRule } =
  useValidationRule();
</script>
