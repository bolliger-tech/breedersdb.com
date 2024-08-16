<template>
  <EntitySelect
    ref="plantRef"
    v-model="plant"
    :label="t('plants.title')"
    :options="plantOptions"
    option-value="id"
    option-label="label_id"
    :loading="fetching"
    :error="error"
    :required="required"
    :filter-fn="filterOptions"
    :no-option-text="t('plants.selectSearchNoOption')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ShallowRef, UnwrapRef, computed, nextTick, ref, watch } from 'vue';
import { graphql } from 'src/graphql';
import { UseQueryArgs, useQuery } from '@urql/vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import {
  FilterSelectOptionsUpdateFn,
  selectFirstOption,
} from 'src/utils/selectOptionFilter';

export interface PlantSelectProps {
  required?: boolean;
  includeId?: number;
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

export type PlantSelectPlant = NonNullable<typeof data.value>['plants'][0];
const emit = defineEmits<{
  plant: [data: PlantSelectPlant];
}>();

const modelValue = defineModel<number | null>({ required: true });

const search = ref(modelValue.value?.toString() || '');

const where = computed(() => {
  const clause: UseQueryArgs<typeof query>['variables'] = {
    _or: [...(props.includeId ? [{ id: { _eq: props.includeId } }] : [])],
  };

  const or = clause._or;

  if (search.value.match(/^\d+$/)) {
    or.push({ label_id: { _eq: `${search.value.padStart(8, '0')}` } });
  }

  if (search.value.match(/^#\d+$/)) {
    or.push({
      label_id: { _eq: `#${search.value.replace('#', '').padStart(8, '0')}` },
    });
  }

  return clause;
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
          lot {
            id
            crossing {
              id
              name
            }
          }
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

watch(plant, () => {
  if (plant.value) {
    emit('plant', plant.value);
  }
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
  search.value = value;
  await nextTick();
  const result = await executeQuery();
  update(
    () => (filteredOptions.value = result.data?.value?.plants ?? []),
    (ref) => selectFirstOption(ref, value),
  );
}
</script>
