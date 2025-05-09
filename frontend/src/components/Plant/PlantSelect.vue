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
    :no-option-text="search ? undefined : t('plants.selectSearchNoOption')"
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
  >
    <template #after-options>
      <q-item dense>
        <q-item-section class="text-grey text-caption text-italic">
          {{ t('plants.selectSearchNoOption') }}
        </q-item-section>
      </q-item>
    </template>
  </EntitySelect>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { ShallowRef, UnwrapRef } from 'vue';
import { computed, nextTick, ref, watch } from 'vue';
import { graphql } from 'src/graphql';
import type { UseQueryArgs } from '@urql/vue';
import { useQuery } from '@urql/vue';
import type { EntitySelectProps } from '../Entity/Edit/EntitySelect.vue';
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { FilterSelectOptionsUpdateFn } from 'src/utils/selectOptionFilter';
import { selectFirstOption } from 'src/utils/selectOptionFilter';
import { plantLabelIdUtils } from 'src/utils/labelIdUtils';
import type { ComponentExposed } from 'vue-component-type-helpers';

export interface PlantSelectProps {
  required?: boolean;
  includeId?: number;
  rejectEliminated?: boolean;
  hint?: string;
  rules?: EntitySelectProps<unknown>['rules'];
}
const props = defineProps<PlantSelectProps>();

const plantRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);

defineExpose({
  validate: () => plantRef.value?.validate(),
  focus: () => plantRef.value && focusInView(plantRef.value),
});

export type PlantSelectPlant = typeof plant.value;
const emit = defineEmits<{
  plantChanged: [plant: PlantSelectPlant];
}>();

const modelValue = defineModel<number | null>({ required: true });

const search = ref(modelValue.value?.toString() || '');

const variables = computed(() => {
  const or: UseQueryArgs<typeof query>['variables'] = [
    { label_id: { _eq: `${plantLabelIdUtils.zeroFill(search.value)}` } },
  ];

  if (props.includeId) {
    or.push({ id: { _eq: props.includeId } });
  }

  return { where: { _or: or } };
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

const { data, error, fetching, ...urql } = useQuery({
  query,
  variables,
  pause: !props.includeId,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['plants'] },
});

const plantOptions = computed(() => data.value?.plants ?? []);

const plant = computed({
  get: () => plantOptions.value.find((o) => o.id === modelValue.value),
  set: (plant) => (modelValue.value = plant?.id ?? null),
});

watch(plant, (newValue) => emit('plantChanged', newValue));

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
  const result = await urql.executeQuery();
  update(
    () => (filteredOptions.value = result.data?.value?.plants ?? []),
    (ref) => selectFirstOption(ref, value),
  );
}
</script>
