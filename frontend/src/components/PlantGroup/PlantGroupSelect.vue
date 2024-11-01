<template>
  <EntitySelect
    ref="plantGroupRef"
    :key="renderKey"
    v-model="plantGroup"
    :label="t('plants.fields.plantGroup')"
    :options="plantGroupOptions"
    option-value="id"
    option-label="display_name"
    :loading="fetching || savingAutocreate"
    :error="error || saveAutocreateError"
    :required="required"
    filter-with-wildcards-around-dots
    @input-value="($event) => (searchValue = $event)"
    @keydown.down="() => autocreateRef?.focusNext()"
    @keydown.enter="() => autocreateRef?.selectFirst()"
  >
    <template v-if="autocreate" #[`no-option`]>
      <PlantGroupSelectAutocreate
        ref="autocreateRef"
        :search-value="searchValue"
        @saving="savingAutocreate = $event"
        @save-error="saveAutocreateError = $event"
        @select="onAutocreateSelect"
      />
    </template>
  </EntitySelect>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { Ref, computed, nextTick, ref } from 'vue';
import { graphql } from 'src/graphql';
import { CombinedError, useQuery } from '@urql/vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import PlantGroupSelectAutocreate from './PlantGroupSelectAutocreate.vue';

export interface PlantGroupSelectProps {
  required?: boolean;
  includeId?: number;
  autocreate?: boolean;
}
const props = defineProps<PlantGroupSelectProps>();

const plantGroupRef: Ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null> = ref(null);

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
  context: { additionalTypenames: ['plant_groups'] },
});

const plantGroupOptions = computed(() => data.value?.plant_groups ?? []);

const plantGroup = computed<{ id: number; display_name: string } | undefined>({
  get: () => plantGroupOptions.value.find((o) => o.id === modelValue.value),
  set: (plantGroup) => (modelValue.value = plantGroup?.id ?? null),
});

const { t } = useI18n();

const searchValue = ref('');
const renderKey = ref(0);
const savingAutocreate = ref(false);
const saveAutocreateError = ref<CombinedError | undefined>(undefined);
const autocreateRef = ref<InstanceType<
  typeof PlantGroupSelectAutocreate
> | null>(null);

async function onAutocreateSelect(plantGroupId: number) {
  modelValue.value = plantGroupId;
  // wait for value propagation before rerendering
  await nextTick();
  // so many states to reset: better to rerender the whole component
  renderKey.value += 1;
}
</script>
