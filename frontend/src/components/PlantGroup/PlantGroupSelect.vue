<template>
  <EntitySelect
    ref="plantGroupRef"
    v-model="plantGroup"
    :label="t('plants.fields.plantGroup')"
    :options="plantGroupOptions"
    option-value="id"
    option-label="display_name"
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

export interface PlantGroupSelectProps {
  required?: boolean;
  includeId?: number;
}
const props = defineProps<PlantGroupSelectProps>();

const plantGroupRef = ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null>(null);

defineExpose({
  validate: () => plantGroupRef.value?.validate(),
  focus: () => plantGroupRef.value && focusInView(plantGroupRef.value),
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
  query PlantGroups($where: plant_groups_bool_exp!) {
    plant_groups(where: $where, order_by: { display_name: asc }) {
      id
      display_name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  variables,
  requestPolicy: 'cache-and-network',
});

const plantGroupOptions = computed(() => data.value?.plant_groups ?? []);

const plantGroup = computed<{ id: number; display_name: string } | undefined>({
  get: () => plantGroupOptions.value.find((o) => o.id === modelValue.value),
  set: (plantGroup) => (modelValue.value = plantGroup?.id ?? null),
});

const { t } = useI18n();
</script>
