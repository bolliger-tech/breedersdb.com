<template>
  <CultivarSelect
    :ref="(el: InputRef) => (refs.motherCultivarId = el)"
    v-model="data.mother_cultivar_id"
    :label="t('crossings.fields.motherCultivar')"
    :loading="fetchingMotherPlants"
    :disable="hasMotherPlants"
    :readonly="hasMotherPlants"
    :hint="hasMotherPlants ? t('crossings.hints.readonlyCultivar') : undefined"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.fatherCultivarId = el)"
    v-model="data.father_cultivar_id"
    :label="t('crossings.fields.fatherCultivar')"
    :loading="fetchingMotherPlants"
    :disable="hasMotherPlantsWithPollen"
    :readonly="hasMotherPlantsWithPollen"
    :hint="
      hasMotherPlantsWithPollen
        ? t('crossings.hints.readonlyCultivar')
        : undefined
    "
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      (val: string) =>
        /^[-_\p{Letter}\d]{1,8}$/u.test(val) ||
        t('base.validation.noSpecialCharsMaxLength', { max: 8 }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    :error="acronymsError ? true : undefined"
    :error-message="
      acronymsError ? t('crossings.acronymsLoadError') : undefined
    "
    required
    trim
    :explainer="t('crossings.nameExplainer')"
  >
    <template v-if="suggestedName && suggestedName !== data.name" #append>
      <q-btn
        :label="t('crossings.autoFillName')"
        flat
        dense
        @click="applySuggestedName"
      />
    </template>
  </EntityInput>
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
import { computed, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import type { CrossingModalEditProps } from './CrossingModalEdit.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import CultivarSelect from '../Cultivar/CultivarSelect.vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';

export interface CrossingEntityFormProps {
  crossing: CrossingModalEditProps['crossing'];
}

const props = defineProps<CrossingEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.crossing.name,
  mother_cultivar_id: props.crossing.mother_cultivar_id || null,
  father_cultivar_id: props.crossing.father_cultivar_id || null,
  note: props.crossing.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  motherCultivarId: null,
  fatherCultivarId: null,
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
  tableName: 'crossings',
  existingId: ('id' in props.crossing && props.crossing.id) || undefined,
});

const motherPlantsQuery = graphql(`
  query MotherPlants($crossingId: Int!) {
    mother_plants(where: { crossing_id: { _eq: $crossingId } }) {
      id
      plant_id
      pollen_id
    }
  }
`);

const { data: motherPlantsData, fetching: fetchingMotherPlants } = useQuery({
  query: motherPlantsQuery,
  variables: { crossingId: 'id' in props.crossing ? props.crossing.id : -1 },
  pause: !('id' in props.crossing),
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['mother_plants'] },
});

const hasMotherPlants = computed(
  () => !!motherPlantsData.value?.mother_plants?.length,
);

const hasMotherPlantsWithPollen = computed(
  () =>
    !!motherPlantsData.value?.mother_plants?.filter((mp) => mp.pollen_id)
      .length,
);

const cultivarAcronymsQuery = graphql(`
  query CrossingCultivarAcronyms($ids: [Int!]!) {
    cultivars(where: { id: { _in: $ids } }) {
      id
      acronym
    }
  }
`);

const acronymIds = computed(() =>
  [data.value.mother_cultivar_id, data.value.father_cultivar_id].filter(
    (id): id is number => !!id,
  ),
);

const { data: acronymsData, error: acronymsError } = useQuery({
  query: cultivarAcronymsQuery,
  variables: computed(() => ({ ids: acronymIds.value })),
  pause: computed(() => acronymIds.value.length === 0),
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['cultivars'] },
});

const suggestedName = computed(() => {
  const byId = new Map(
    acronymsData.value?.cultivars?.map((c) => [c.id, c.acronym]) ?? [],
  );
  const mother = byId.get(data.value.mother_cultivar_id ?? -1)?.trim() ?? '';
  const father = byId.get(data.value.father_cultivar_id ?? -1)?.trim() ?? '';
  return capitalize(mother) + capitalize(father);
});

function applySuggestedName() {
  if (suggestedName.value) {
    data.value.name = suggestedName.value;
  }
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
</script>
