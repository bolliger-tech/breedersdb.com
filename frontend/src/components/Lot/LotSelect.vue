<template>
  <EntitySelect
    ref="lotRef"
    v-model="lot"
    :label="t('lots.title')"
    :options="lotOptions"
    option-value="id"
    option-label="display_name"
    :loading="fetching"
    :error="error"
    :required="required"
    filter-with-wildcards-around-dots
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

export interface LotSelectProps {
  required?: boolean;
  includeId?: number;
  options: 'no_varieties' | 'varieties' | 'all';
  requestPolicy?: Parameters<typeof useQuery>[0]['requestPolicy'];
}

const props = defineProps<LotSelectProps>();

const lotRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);

defineExpose({
  validate: () => lotRef.value?.validate(),
  focus: () => lotRef.value && focusInView(lotRef.value),
});

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Lots($where: lots_bool_exp!) {
    lots(where: $where, order_by: { display_name: asc }) {
      id
      display_name
    }
  }
`);

const variables = computed(() => {
  const or = [];

  if (props.includeId) {
    or.push({ id: { _eq: props.includeId } });
  }

  if (props.options === 'no_varieties') {
    or.push({ is_variety: { _eq: false } });
  } else if (props.options === 'varieties') {
    or.push({ is_variety: { _eq: true } });
  }

  return { where: or.length ? { _or: or } : {} };
});

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: props.requestPolicy ?? 'cache-and-network',
  variables,
  context: { additionalTypenames: ['lots'] },
});

const lotOptions = computed(() => data.value?.lots ?? []);

const lot = computed({
  get: () => lotOptions.value.find((o) => o.id === modelValue.value),
  set: (lot) => (modelValue.value = lot?.id ?? null),
});

const { t } = useI18n();
</script>
