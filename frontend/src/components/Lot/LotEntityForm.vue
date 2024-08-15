<template>
  <CrossingSelect
    :ref="(el: InputRef) => (refs.crossingRef = el)"
    v-model="data.crossing_id"
    :required="true"
    @update:model-value="
      () => data.name_segment && refs.nameInputsRef?.validate()
    "
  />
  <LotNameInputs
    :ref="(el: InputRef) => (refs.nameInputsRef = el)"
    v-model:name-segment="data.name_segment"
    v-model:name-override="data.name_override"
    :crossing-id="data.crossing_id"
    :lot-id="('id' in props.lot && props.lot.id) || undefined"
  />
  <OrchardSelect
    :ref="(el: InputRef) => (refs.orchardRef = el)"
    v-model="data.orchard_id"
    :required="true"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateSowedRef = el)"
    v-model="data.date_sowed"
    :label="t('lots.fields.dateSowed')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedsSowedRef = el)"
    v-model="data.numb_seeds_sowed"
    :label="t('lots.fields.numbSeedsSowed')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | null | undefined) =>
        !value ||
        isValidInteger({
          value,
          validation: { min: 0, max: MAX_INT_PG, step: 1 },
        }) ||
        t('base.validation.integerBetween', {
          min: 0,
          max: MAX_INT_PG,
          step: 1,
        }),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedlingsGrownRef = el)"
    v-model="data.numb_seedlings_grown"
    :label="t('lots.fields.numbSeedlingsGrown')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | null | undefined) =>
        !value ||
        isValidInteger({
          value,
          validation: { min: 0, max: MAX_INT_PG, step: 1 },
        }) ||
        t('base.validation.integerBetween', {
          min: 0,
          max: MAX_INT_PG,
          step: 1,
        }),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.seedTrayRef = el)"
    v-model="data.seed_tray"
    :label="t('lots.fields.seedTray')"
    type="text"
    autocomplete="off"
    autogrow
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 255 || t('base.validation.maxLen', { x: 255 }),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.datePlantedRef = el)"
    v-model="data.date_planted"
    :label="t('lots.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedlingsPlantedRef = el)"
    v-model="data.numb_seedlings_planted"
    :label="t('lots.fields.numbSeedlingsPlanted')"
    type="number"
    autocomplete="off"
    :step="1"
    :rules="[
      (value: string | null | undefined) =>
        !value ||
        isValidInteger({
          value,
          validation: { min: 0, max: MAX_INT_PG, step: 1 },
        }) ||
        t('base.validation.integerBetween', {
          min: 0,
          max: MAX_INT_PG,
          step: 1,
        }),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.plotRef = el)"
    v-model="data.plot"
    :label="t('lots.fields.plot')"
    type="text"
    :rows="1"
    autocomplete="off"
    autogrow
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 255 || t('base.validation.maxLen', { x: 255 }),
    ]"
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
import { LotEditInput, LotInsertInput } from './LotModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import CrossingSelect from '../Crossing/CrossingSelect.vue';
import OrchardSelect from '../Orchard/OrchardSelect.vue';
import { MAX_INT_PG } from 'src/utils/constants';
import { isValidInteger } from 'src/utils/validationUtils';
import LotNameInputs from './LotNameInputs.vue';

export interface LotEntityFormProps {
  lot: LotInsertInput | LotEditInput;
}

const props = defineProps<LotEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name_segment: props.lot.name_segment,
  name_override: props.lot.name_override,
  date_sowed: props.lot.date_sowed,
  numb_seeds_sowed: props.lot.numb_seeds_sowed,
  numb_seedlings_grown: props.lot.numb_seedlings_grown,
  seed_tray: props.lot.seed_tray,
  date_planted: props.lot.date_planted,
  numb_seedlings_planted: props.lot.numb_seedlings_planted,
  plot: props.lot.plot,
  note: props.lot.note,
  orchard_id: props.lot.orchard_id || null,
  crossing_id: props.lot.crossing_id || null,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameInputsRef: null,
  dateSowedRef: null,
  numbSeedsSowedRef: null,
  numbSeedlingsGrownRef: null,
  seedTrayRef: null,
  datePlantedRef: null,
  numbSeedlingsPlantedRef: null,
  plotRef: null,
  noteRef: null,
  orchardRef: null,
  crossingRef: null,
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
