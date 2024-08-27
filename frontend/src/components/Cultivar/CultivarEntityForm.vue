<template>
  <BaseInputLabel :label="t('cultivars.type')" class="q-mb-md">
    <div class="row items-center">
      <q-btn-toggle
        v-model="type"
        unelevated
        rounded
        toggle-color="primary"
        style="border: 1px solid var(--q-primary)"
        :options="[
          {
            label: t('cultivars.breedersCultivar', 1),
            value: 'breeders_cultivar',
          },
          { label: t('cultivars.variety', 1), value: 'variety' },
        ]"
      />
      <q-spinner
        v-if="varietyLotFetching && type === 'variety'"
        size="md"
        class="q-ml-md"
      />
    </div>
  </BaseInputLabel>
  <LotSelect
    v-if="type === 'breeders_cultivar' || varietyLots.length !== 1"
    :ref="(el: InputRef) => (refs.lotId = el)"
    v-model="data.lot_id"
    required
    :options="
      type === 'breeders_cultivar'
        ? 'no_varieties'
        : type === 'variety'
          ? 'varieties'
          : 'all'
    "
    :include-id="data.lot_id || undefined"
    @update:model-value="() => data.name_segment && refs.nameInputs?.validate()"
  />
  <CultivarNameInputs
    v-if="type === 'breeders_cultivar'"
    :ref="(el: InputRef) => (refs.nameInputs = el)"
    v-model:name-segment="data.name_segment"
    v-model:name-override="data.name_override"
    :cultivar-id="('id' in props.cultivar && props.cultivar.id) || undefined"
    :lot-id="data.lot_id || undefined"
  />
  <CultivarNameOverrideInput
    v-if="type === 'variety'"
    :ref="(el: InputRef) => (refs.nameOverride = el)"
    v-model="data.name_override"
    :full-name="undefined"
    :hint="`${t('cultivars.nameOverrideHint')}. ${t('base.required')}.`"
    :cultivar-id="('id' in props.cultivar && props.cultivar.id) || undefined"
    :loading="varietyNameSegmentFetching"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.acronym = el)"
    v-model="data.acronym"
    :label="t('cultivars.fields.acronym')"
    type="text"
    autocomplete="off"
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 8 || t('base.validation.maxLen', { x: 8 }),
      (val: string | null | undefined) =>
        !val ||
        /^[-_\w\d]{1,8}$/.test(val) ||
        t('base.validation.noSpecialCharsMaxLength', { max: 8 }),
      async (val: string | null | undefined) =>
        !val ||
        (await isAcronymUnique(val)) ||
        t('base.validation.nameNotUnique'),
    ]"
    :loading="fetchingAcronymUnique"
  />
  <EntityInput
    v-if="type === 'variety'"
    :ref="(el: InputRef) => (refs.breeder = el)"
    v-model="data.breeder"
    :label="t('cultivars.fields.breeder')"
    type="text"
    autocomplete="off"
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
import { computed, ref } from 'vue';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  CultivarEditInput,
  CultivarInsertInput,
} from './CultivarModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import LotSelect from 'src/components/Lot/LotSelect.vue';
import CultivarNameInputs from './CultivarNameInputs.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import CultivarNameOverrideInput from './CultivarNameOverrideInput.vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';

export interface CultivarEntityFormProps {
  cultivar: CultivarInsertInput | CultivarEditInput;
  isVariety: boolean;
}

const props = defineProps<CultivarEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name_segment: props.cultivar.name_segment,
  name_override: props.cultivar.name_override,
  lot_id: props.cultivar.lot_id || null,
  acronym: props.cultivar.acronym,
  breeder: props.cultivar.breeder,
  note: props.cultivar.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameInputs: null,
  nameOverride: null,
  lotId: null,
  acronym: null,
  breeder: null,
  note: null,
});

const type = ref<'breeders_cultivar' | 'variety'>(
  props.isVariety ? 'variety' : 'breeders_cultivar',
);

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

const { isUnique: isAcronymUnique, fetching: fetchingAcronymUnique } =
  useIsUnique({
    tableName: 'cultivars',
    columnName: 'acronym',
    existingId: ('id' in props.cultivar && props.cultivar.id) || undefined,
  });

/**
 * set lot_id
 *
 * the whole block below is for varieties (and to reset it for breeders_cultivars)
 */
const varietyLotQuery = graphql(`
  query VarietyLot {
    lots(where: { is_variety: { _eq: true } }) {
      id
      display_name
    }
  }
`);

const { data: varietyLotData, fetching: varietyLotFetching } = useQuery({
  query: varietyLotQuery,
  requestPolicy: 'cache-and-network',
});

const varietyLots = computed(() => varietyLotData.value?.lots ?? []);

let lastVarietyLotId: number | null =
  type.value === 'variety' ? data.value.lot_id : null;
let lastNonVarietyLotId: number | null =
  type.value === 'breeders_cultivar' ? data.value.lot_id : null;

function automagicallySetLotId({
  oldType,
  newType,
  newVarietyLots,
}: {
  oldType: typeof type.value;
  newType: typeof type.value;
  newVarietyLots: typeof varietyLots.value;
}) {
  if (newType === 'variety' && oldType !== 'variety') {
    lastNonVarietyLotId = data.value.lot_id;
  } else if (newType !== 'variety' && oldType === 'variety') {
    lastVarietyLotId = data.value.lot_id;
  }

  if (!varietyLots.value.length) {
    // don't do anything before varietyLots are fetched (or if there aren't any)
    return;
  }

  if (newType === 'variety') {
    // if there is only one lot with is_variety === true, set it, no mater what
    if (newVarietyLots.length === 1) {
      data.value.lot_id = newVarietyLots[0].id;
    } else {
      // if the current lot_id is not a variety lot, set it to lastVarietyLotId
      if (!newVarietyLots.find((lot) => lot.id === data.value.lot_id)) {
        data.value.lot_id = lastVarietyLotId;
      }
    }
  } else {
    // if the current lot_id is a variety lot, set it to lastNonVarietyLotId
    if (newVarietyLots.find((lot) => lot.id === data.value.lot_id)) {
      data.value.lot_id = lastNonVarietyLotId;
    }
  }
}

watch([type, varietyLots], ([newType, newVarietyLots], [oldType]) =>
  automagicallySetLotId({ oldType, newType, newVarietyLots }),
);

/**
 * set name_segment
 *
 * the whole block below is for varieties (and to reset it for breeders_cultivars)
 */

const normalizedName = computed(() => {
  return (data.value.name_override || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 20);
});

const varietyNameSegmentQuery = graphql(`
  query VarietyNameSegment(
    $cultivarId: Int!
    $lotId: Int!
    $nameSegmentTerm: citext!
  ) {
    cultivars(
      where: {
        id: { _neq: $cultivarId }
        name_segment: { _ilike: $nameSegmentTerm }
        lot_id: { _eq: $lotId }
      }
    ) {
      id
      name_segment
    }
  }
`);

const varietyNameSegmentQueryVariables = computed(() => ({
  cultivarId: ('id' in props.cultivar && props.cultivar.id) || -1,
  lotId: data.value.lot_id || -1,
  nameSegmentTerm: `${normalizedName.value}%`,
}));

const {
  data: varietyNameSegmentData,
  fetching: varietyNameSegmentFetching,
  resume: varietyNameSegmentFetchingResume,
  pause: varietyNameSegmentFetchingPause,
} = useQuery({
  query: varietyNameSegmentQuery,
  variables: varietyNameSegmentQueryVariables,
  pause: true,
  requestPolicy: 'cache-and-network',
});

// using this directly in the pause option of useQuery() doesn't work
// therefore we use the watch() below
const varietyNameSegmentQueryPause = computed(
  () => type.value !== 'variety' || !normalizedName.value || !data.value.lot_id,
);
watch(varietyNameSegmentQueryPause, (pause) => {
  if (pause) {
    varietyNameSegmentFetchingPause();
  } else {
    varietyNameSegmentFetchingResume();
  }
});

const nextFreeVarietyNameSegment = computed(() => {
  if (!varietyNameSegmentData.value) {
    return normalizedName.value;
  }

  const takenSegments = varietyNameSegmentData.value.cultivars.map(
    (cultivar) => cultivar.name_segment,
  );

  let i = 1;
  let newSegment = normalizedName.value;
  while (takenSegments.includes(newSegment)) {
    newSegment = `${normalizedName.value}-${i}`;
    i++;
  }

  return newSegment;
});

let lastNameSegment: string =
  type.value !== 'variety' ? data.value.name_segment : '';

function automagicallySetNameSegment({
  oldType,
  newType,
  newNextFreeVarietyNameSegment,
}: {
  oldType: typeof type.value;
  newType: typeof type.value;
  newNextFreeVarietyNameSegment: typeof nextFreeVarietyNameSegment.value;
}) {
  if (newType === 'variety' && oldType !== 'variety') {
    lastNameSegment = data.value.name_segment;
  }

  if (newType === 'variety') {
    data.value.name_segment = newNextFreeVarietyNameSegment;
  } else if (oldType === 'variety') {
    data.value.name_segment = lastNameSegment;
  }
}

watch(
  [type, nextFreeVarietyNameSegment],
  ([newType, newNextFreeVarietyNameSegment], [oldType]) =>
    automagicallySetNameSegment({
      oldType,
      newType,
      newNextFreeVarietyNameSegment,
    }),
);

/**
 * set breeder
 *
 * the whole block below is for varieties (and to reset it for breeders_cultivars)
 */
let lastBreeder: string | null =
  type.value === 'variety' ? data.value.breeder : null;
watch(type, (newType) => {
  if (newType === 'variety') {
    data.value.breeder = lastBreeder;
  } else {
    lastBreeder = data.value.breeder;
    data.value.breeder = null;
  }
});
</script>
