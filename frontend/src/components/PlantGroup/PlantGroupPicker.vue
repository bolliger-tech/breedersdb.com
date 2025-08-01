<template>
  <EntityPicker
    ref="inputRef"
    entity-type="plantGroup"
    :error="error?.message"
    @input="
      {
        input = $event;
        loadPlantGroup();
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
import type { PlantGroupFragment } from './plantGroupFragment';
import { plantGroupFragment } from './plantGroupFragment';
import { onMounted } from 'vue';
import EntityPicker from 'src/components/Entity/EntityPicker.vue';

export interface PlantGroupPickerProps {
  rejectDisabled?: boolean;
}

const props = withDefaults(defineProps<PlantGroupPickerProps>(), {
  rejectDisabled: false,
});

const emit = defineEmits<{
  plantGroup: [data: PlantGroupFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('plantGroup', null));

const inputRef = ref<InstanceType<typeof EntityPicker> | null>(null);

defineExpose({
  loadEntity: async () => {
    inputRef.value?.emitInputs();
    await nextTick();
    await loadPlantGroup();
  },
  focus: () => {
    inputRef.value?.focus();
  },
});

const input = ref<{
  plantLabelId: string | null;
  plantGroupLabelId: string | null;
  cultivarId: number | null;
  lotId: number | null;
}>({
  plantLabelId: null,
  plantGroupLabelId: null,
  cultivarId: null,
  lotId: null,
});

const { t } = useI18n();

const error = computed<
  | {
      type: 'notFound' | 'disabledNotAllowed';
      message: string;
    }
  | undefined
>(() => {
  if (
    data.value?.plant_groups.length === 0 &&
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

  if (data.value?.plant_groups[0]?.disabled && props.rejectDisabled)
    return {
      type: 'disabledNotAllowed',
      message: t('plantGroups.errors.disabledNotAllowed'),
    };

  return undefined;
});

const queryPlantGroupByLabelId = graphql(
  `
    query PlantGroupByLabelId(
      $labelId: citext!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      plant_groups(where: { label_id: { _eq: $labelId } }) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);
const queryPlantGroupByPlantLabelId = graphql(
  `
    query PlantGroupByPlantLabelId(
      $labelId: citext!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      plant_groups(where: { plants: { label_id: { _eq: $labelId } } }) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);
const query = computed(() =>
  input.value.plantLabelId
    ? queryPlantGroupByPlantLabelId
    : queryPlantGroupByLabelId,
);
const variables = computed(() => ({
  labelId: input.value.plantLabelId || input.value.plantGroupLabelId || '',
}));

const {
  fetching,
  data,
  error: fetchError,
  ...urql
} = await useQuery({
  query,
  variables,
  pause: true,
  context: { additionalTypenames: ['plant_groups'] },
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.plant_groups[0] && !d.plant_groups[0].disabled) {
    emit('plantGroup', d.plant_groups[0]);
  }
});

async function loadPlantGroup() {
  await nextTick(); // ensure the useQuery({variables}) is updated
  await urql.executeQuery();
}
</script>
