<template>
  <EntitySelect
    ref="crossingRef"
    v-model="crossing"
    :label="t('crossings.title')"
    :options="crossingOptions"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
    :required="required"
    :readonly="readonly"
    :rules="rules"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import type { EntitySelectProps } from '../Entity/Edit/EntitySelect.vue';
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { ComponentExposed } from 'vue-component-type-helpers';

export interface CrossingSelectProps {
  required?: boolean;
  readonly?: boolean;
  includeId?: number;
  rules?: EntitySelectProps<unknown>['rules'];
}
const props = defineProps<CrossingSelectProps>();

const crossingRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);

defineExpose({
  validate: () => crossingRef.value?.validate(),
  focus: () => crossingRef.value && focusInView(crossingRef.value),
});

export type CrossingSelectCrossing = typeof crossing.value;
const emit = defineEmits<{
  crossingChanged: [crossing: CrossingSelectCrossing];
}>();

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Crossings($where: crossings_bool_exp!) {
    crossings(where: $where, order_by: { name: asc }) {
      id
      name
      mother_cultivar {
        id
        display_name
      }
      father_cultivar {
        id
        display_name
      }
    }
  }
`);

const variables = computed(() => ({
  where: {
    _or: [
      { is_variety: { _eq: false } },
      ...(props.includeId ? [{ id: { _eq: props.includeId } }] : []),
    ],
  },
}));

const { data, error, fetching } = useQuery({
  query,
  variables,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['crossings'] },
});

const crossingOptions = computed(() => data.value?.crossings ?? []);

const crossing = computed({
  get: () => crossingOptions.value.find((o) => o.id === modelValue.value),
  set: (crossing) => (modelValue.value = crossing?.id ?? null),
});

watch(crossing, (newCrossing) => emit('crossingChanged', newCrossing));

const { t } = useI18n();
</script>
