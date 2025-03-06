<template>
  <EntityPicker
    ref="inputRef"
    entity-type="lot"
    :error="error?.message"
    @input="
      {
        input = $event;
        loadLot();
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
import type { LotFragment } from './lotFragment';
import { lotFragment } from './lotFragment';
import { onMounted } from 'vue';
import EntityPicker from 'src/components/Entity/EntityPicker.vue';

const emit = defineEmits<{
  lot: [data: LotFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('lot', null));

const inputRef = ref<InstanceType<typeof EntityPicker> | null>(null);

defineExpose({
  loadEntity: async () => {
    inputRef.value?.emitInputs();
    await nextTick();
    await loadLot();
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
    data.value?.lots.length === 0 &&
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

const queryLotByPlantLabelId = graphql(
  `
    query LotByPlantLabelId(
      $labelId: citext!
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      lots(
        where: {
          cultivars: {
            plant_groups: { plants: { label_id: { _eq: $labelId } } }
          }
        }
      ) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);
const queryLotByPlantGroupLabelId = graphql(
  `
    query LotByPlantGroupLabelId(
      $labelId: citext!
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      lots(
        where: { cultivars: { plant_groups: { label_id: { _eq: $labelId } } } }
      ) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);
const queryLotByCultivarId = graphql(
  `
    query LotByCultivarId(
      $id: Int!
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      lots(where: { cultivars: { id: { _eq: $id } } }) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);
const queryLotById = graphql(
  `
    query LotById(
      $id: Int!
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      lots(where: { id: { _eq: $id } }) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);
const query = computed(() =>
  input.value.lotId
    ? queryLotById
    : input.value.cultivarId
      ? queryLotByCultivarId
      : input.value.plantLabelId
        ? queryLotByPlantLabelId
        : queryLotByPlantGroupLabelId,
);

const labelIdForQuery = computed(() => ({
  labelId: input.value.plantLabelId || input.value.plantGroupLabelId || '',
}));
const entityIdForQuery = computed(() => ({
  id: input.value.lotId || input.value.cultivarId || 0,
}));
const variables = computed(() =>
  input.value.lotId || input.value.cultivarId
    ? entityIdForQuery.value
    : labelIdForQuery.value,
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
  context: { additionalTypenames: ['lots'] },
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.lots.length) {
    emit('lot', d.lots[0] as LotFragment);
  }
});

async function loadLot() {
  await nextTick(); // ensure the useQuery({variables}) is updated
  await urql.executeQuery();
}
</script>
