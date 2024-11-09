<template>
  <EntitySelect
    :ref="plantRowRef"
    v-model="plantRow"
    :label="t('plants.fields.plantRow')"
    :options="plantRowOptions"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
    :required="required"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';

export interface PlantRowSelectProps {
  required?: boolean;
  includeId?: number;
}
const props = defineProps<PlantRowSelectProps>();

const plantRowRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => plantRowRef.value?.validate(),
  focus: () => plantRowRef.value && focusInView(plantRowRef.value),
});

const modelValue = defineModel<number | null>({ required: true });

const variables = computed(() => ({
  where: {
    _or: [
      { disabled: { _eq: false } },
      ...(props.includeId ? [{ id: { _eq: props.includeId } }] : []),
    ],
  },
}));

const query = graphql(`
  query PlantRows($where: plant_rows_bool_exp!) {
    plant_rows(where: $where, order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  variables,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['plant_rows'] },
});

const plantRowOptions = computed(() => data.value?.plant_rows ?? []);

const plantRow = computed<{ id: number; name: string } | undefined>({
  get: () => plantRowOptions.value.find((o) => o.id === modelValue.value),
  set: (plantRow) => (modelValue.value = plantRow?.id ?? null),
});

const { t } = useI18n();
</script>
