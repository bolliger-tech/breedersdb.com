<template>
  <CrossingSelect
    :ref="(el: InputRef) => (refs.crossingId = el)"
    v-model="data.crossing_id"
    :required="true"
    :include-id="data.crossing_id || undefined"
    @update:model-value="() => data.name_segment && refs.nameInputs?.validate()"
  />
  <LotNameInputs
    v-if="!isVariety"
    :ref="(el: InputRef) => (refs.nameInputs = el)"
    v-model:name-segment="data.name_segment"
    v-model:name-override="data.name_override"
    :crossing-id="data.crossing_id"
    :lot-id="('id' in props.lot && props.lot.id) || undefined"
  />
  <OrchardSelect
    :ref="(el: InputRef) => (refs.orchardId = el)"
    v-model="data.orchard_id"
    :required="true"
    :include-id="data.orchard_id || undefined"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateSowed = el)"
    v-model="data.date_sowed"
    :label="t('lots.fields.dateSowed')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedsSowed = el)"
    v-model="data.numb_seeds_sowed"
    :label="t('lots.fields.numbSeedsSowed')"
    type="number"
    autocomplete="off"
    :step="1"
    :min="0"
    :max="MAX_INT_PG"
    :rules="[
      (value: string | number | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedlingsGrown = el)"
    v-model="data.numb_seedlings_grown"
    :label="t('lots.fields.numbSeedlingsGrown')"
    type="number"
    autocomplete="off"
    :step="1"
    :min="0"
    :max="MAX_INT_PG"
    :rules="[
      (value: string | number | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.seedTray = el)"
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
    :ref="(el: InputRef) => (refs.datePlanted = el)"
    v-model="data.date_planted"
    :label="t('lots.fields.datePlanted')"
    type="date"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.numbSeedlingsPlanted = el)"
    v-model="data.numb_seedlings_planted"
    :label="t('lots.fields.numbSeedlingsPlanted')"
    type="number"
    autocomplete="off"
    :step="1"
    :min="0"
    :max="MAX_INT_PG"
    :rules="[
      (value: string | number | null | undefined) =>
        !value || isPositiveIntegerRule(value),
    ]"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.plot = el)"
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
import { LotEditInput, LotInsertInput } from './LotModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import CrossingSelect from '../Crossing/CrossingSelect.vue';
import OrchardSelect from '../Orchard/OrchardSelect.vue';
import LotNameInputs from './LotNameInputs.vue';
import { useValidationRule } from 'src/composables/useValidationRule';
import { MAX_INT_PG } from 'src/utils/constants';

export interface LotEntityFormProps {
  lot: LotInsertInput | LotEditInput;
  isVariety: boolean;
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
  crossingId: null,
  nameInputs: null,
  orchardId: null,
  dateSowed: null,
  numbSeedsSowed: null,
  numbSeedlingsGrown: null,
  seedTray: null,
  datePlanted: null,
  numbSeedlingsPlanted: null,
  plot: null,
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

const { isPositiveIntegerRule } = useValidationRule();
</script>
