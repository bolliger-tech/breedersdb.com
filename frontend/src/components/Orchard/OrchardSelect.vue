<template>
  <EntitySelect
    ref="orchardRef"
    v-model="orchard"
    :label="t('orchards.title')"
    :options="orchardOptions"
    option-value="id"
    option-label="name"
    :option-disable="isOptionDisabled"
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
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { ComponentExposed } from 'vue-component-type-helpers';

export interface OrchardSelectProps {
  required?: boolean;
  includeId?: number;
}
const props = defineProps<OrchardSelectProps>();

const orchardRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);

defineExpose({
  validate: () => orchardRef.value?.validate(),
  focus: () => orchardRef.value && focusInView(orchardRef.value),
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
  query Orchards($where: orchards_bool_exp!) {
    orchards(order_by: { name: asc }, where: $where) {
      id
      name
      disabled
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  variables,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['orchards'] },
});

const orchardOptions = computed(() => data.value?.orchards ?? []);

const orchard = computed({
  get: () => orchardOptions.value.find((o) => o.id === modelValue.value),
  set: (orchard) => (modelValue.value = orchard?.id ?? null),
});

function isOptionDisabled(option: (typeof orchardOptions.value)[0]) {
  return option.disabled;
}

const { t } = useI18n();
</script>
