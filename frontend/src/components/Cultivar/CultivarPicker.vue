<template>
  <EntityPicker
    ref="inputRef"
    entity-type="cultivar"
    :error="error?.message"
    @input="
      {
        input = $event;
        loadCultivar();
      }
    "
  />
  <BaseGraphqlError v-if="fetchError" :error="fetchError" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { computed } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import type { CultivarFragment } from './cultivarFragment';
import { cultivarFragment } from './cultivarFragment';
import { onMounted } from 'vue';
import EntityPicker from 'src/components/Entity/EntityPicker.vue';

const emit = defineEmits<{
  cultivar: [data: CultivarFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('cultivar', null));

const inputRef = ref<InstanceType<typeof EntityPicker> | null>(null);

defineExpose({
  loadEntity: async () => {
    inputRef.value?.emitInputs();
    await nextTick();
    await loadCultivar();
  },
  focus: () => {
    inputRef.value?.focus();
  },
});

const input = ref<{
  plantLabelId: string;
  plantGroupLabelId: string;
  cultivarId: number | null;
  lotId: number | null;
}>({
  plantLabelId: '',
  plantGroupLabelId: '',
  cultivarId: null,
  lotId: null,
});

const { t } = useI18n();

const error = computed<
  | {
      type: 'notFound';
      message: string;
    }
  | undefined
>(() => {
  if (
    data.value?.cultivars.length === 0 &&
    (input.value.plantLabelId || input.value.plantGroupLabelId)
  )
    return {
      type: 'notFound',
      message: input.value.plantLabelId
        ? t('plants.errors.labelIdNotFound', {
            labelId: input.value.plantLabelId,
          })
        : t('plantGroups.errors.labelIdNotFound', {
            labelId: input.value.plantGroupLabelId,
          }),
    };
  return undefined;
});

const queryCultivarByPlantLabelId = graphql(
  `
    query CultivarByPlantLabelId(
      $labelId: citext!
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      cultivars(
        where: { plant_groups: { plants: { label_id: { _eq: $labelId } } } }
      ) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);
const queryCultivarByPlantGroupLabelId = graphql(
  `
    query CultivarByPlantGroupLabelId(
      $labelId: citext!
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      cultivars(where: { plant_groups: { label_id: { _eq: $labelId } } }) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);
const queryCultivarById = graphql(
  `
    query CultivarById(
      $id: Int!
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      cultivars(where: { id: { _eq: $id } }) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);
const query = computed(() =>
  input.value.cultivarId
    ? queryCultivarById
    : input.value.plantLabelId
      ? queryCultivarByPlantLabelId
      : queryCultivarByPlantGroupLabelId,
);

const labelIdForQuery = computed(() => ({
  labelId: input.value.plantLabelId || input.value.plantGroupLabelId || '',
}));
const cultivarIdForQuery = computed(() => ({
  id: input.value.cultivarId || 0,
}));
const variables = computed(() =>
  input.value.cultivarId ? cultivarIdForQuery.value : labelIdForQuery.value,
);

const {
  fetching,
  data,
  error: fetchError,
  ...urql
} = await useQuery({
  query,
  variables,
  pause: true,
  context: { additionalTypenames: ['cultivars'] },
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.cultivars.length) {
    emit('cultivar', d.cultivars[0] as CultivarFragment);
  }
});

async function loadCultivar() {
  await nextTick(); // ensure the useQuery({variables}) is updated
  await urql.executeQuery();
}
</script>
