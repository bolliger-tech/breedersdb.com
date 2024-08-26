<template>
  <EntityPicker
    ref="inputRef"
    entity-type="plant"
    :error="error?.message"
    @input="
      {
        input = $event;
        loadPlant();
      }
    "
  />
  <BaseGraphqlError v-if="fetchError" :error="fetchError" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { plantLabelIdUtils } from 'src/utils/labelIdUtils';
import { computed } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { PlantFragment, plantFragment } from './plantFragment';
import { onMounted } from 'vue';
import EntityPicker from 'src/components/Entity/EntityPicker.vue';

export interface PlantPickerProps {
  rejectEliminated?: boolean;
}

const props = withDefaults(defineProps<PlantPickerProps>(), {
  rejectEliminated: false,
});

const emit = defineEmits<{
  plant: [data: PlantFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('plant', null));

const inputRef = ref<InstanceType<typeof EntityPicker> | null>(null);

defineExpose({
  loadEntity: async () => {
    inputRef.value?.emitInputs();
    await nextTick();
    loadPlant();
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
      type: 'notFound' | 'eliminatedNotAllowed';
      message: string;
    }
  | undefined
>(() => {
  if (data.value?.plants.length === 0)
    return {
      type: 'notFound',
      message: t('plants.errors.labelIdNotFound', {
        labelId: input.value.plantLabelId,
      }),
    };

  if (
    props.rejectEliminated &&
    plantLabelIdUtils.isPrefixed(input.value.plantLabelId)
  )
    return {
      type: 'eliminatedNotAllowed',
      message: t('plants.errors.eliminatedNotAllowed'),
    };

  return undefined;
});

const query = graphql(
  `
    query PlantByLabelId(
      $label_id: citext!
      $PlantWithSegments: Boolean = true
    ) {
      plants(where: { label_id: { _eq: $label_id } }) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const variables = computed(() => ({ label_id: input.value.plantLabelId }));

const {
  executeQuery,
  fetching,
  data,
  error: fetchError,
} = useQuery({
  query,
  pause: true,
  variables,
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.plants.length && !d.plants[0].disabled) {
    emit('plant', d.plants[0]);
  }
});

async function loadPlant() {
  await nextTick(); // ensure the useQuery({variables}) is updated
  await executeQuery();
}
</script>
