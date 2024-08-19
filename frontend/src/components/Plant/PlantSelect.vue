<template>
  <EntitySelect
    ref="plantRef"
    v-model="plant"
    :label="t('plants.plantSelect')"
    :options="plantOptions"
    option-value="id"
    option-label="label_id"
    :loading="fetching"
    :error="error"
    :required="required"
    :filter-fn="filterOptions"
    :no-option-text="t('plants.selectSearchNoOption')"
    :rules="[
      (v: PlantSelectPlant | null | undefined) =>
        !v ||
        !rejectEliminated ||
        (includeId && v?.id === includeId) ||
        !v.disabled ||
        t('plants.errors.eliminatedNotAllowed'),
      ...rules,
    ]"
    :hint="hint"
    @update:model-value="(p: PlantSelectPlant) => $emit('plantChanged', p)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ShallowRef, UnwrapRef, computed, nextTick, ref } from 'vue';
import { graphql } from 'src/graphql';
import { UseQueryArgs, useQuery } from '@urql/vue';
import EntitySelect, {
  EntitySelectProps,
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import {
  FilterSelectOptionsUpdateFn,
  selectFirstOption,
} from 'src/utils/selectOptionFilter';
import { zeroFill } from 'src/utils/labelIdUtils';

export interface PlantSelectProps {
  required?: boolean;
  includeId?: number;
  rejectEliminated?: boolean;
  hint?: string;
  rules?: EntitySelectProps<unknown>['rules'];
}
const props = defineProps<PlantSelectProps>();

const plantRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => plantRef.value?.validate(),
  focus: () => plantRef.value && focusInView(plantRef.value),
});

export type PlantSelectPlant = typeof plant.value;
defineEmits<{
  plantChanged: [plant: PlantSelectPlant];
}>();

const modelValue = defineModel<number | null>({ required: true });

const search = ref(modelValue.value?.toString() || '');

const where = computed(() => {
  const or: UseQueryArgs<typeof query>['variables'] = [
    { label_id: { _eq: `${zeroFill(search.value)}` } },
  ];

  if (props.includeId) {
    or.push({ id: { _eq: props.includeId } });
  }

  return { _or: or };
});

const query = graphql(`
  query Plants($where: plants_bool_exp!) {
    plants(order_by: { label_id: asc }, where: $where, limit: 20) {
      id
      label_id
      disabled
      plant_group {
        id
        cultivar {
          id
          display_name
        }
      }
    }
  }
`);

const { data, error, fetching, executeQuery } = useQuery({
  query,
  variables: { where },
  pause: !props.includeId,
  requestPolicy: 'cache-and-network',
});

const plantOptions = computed(() => data.value?.plants ?? []);

const plant = computed({
  get: () => plantOptions.value.find((o) => o.id === modelValue.value),
  set: (plant) => (modelValue.value = plant?.id ?? null),
});

const { t } = useI18n();

async function filterOptions(
  value: string,
  update: FilterSelectOptionsUpdateFn,
  filteredOptions: ShallowRef<UnwrapRef<typeof plantOptions>>,
) {
  if (!value.length) {
    update(
      () => (filteredOptions.value = plantOptions.value),
      (ref) => selectFirstOption(ref, value),
    );
    return;
  }
  search.value = value.trim();
  await nextTick();
  const result = await executeQuery();
  update(
    () => (filteredOptions.value = result.data?.value?.plants ?? []),
    (ref) => selectFirstOption(ref, value),
  );
}
</script>
