<template>
  <EntitySelect
    :ref="orchardRef"
    v-model="orchard"
    :label="t('orchards.title')"
    :options="orchardOptions"
    :option-disable="isDisabled"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
    required
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

export interface OrchardSelectProps {
  withDisabled?: boolean;
}

const props = defineProps<OrchardSelectProps>();

const orchardRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => orchardRef.value?.validate(),
  focus: () => orchardRef.value && focusInView(orchardRef.value),
});

const modelValue = defineModel<number | null>({ required: true });

const where = computed(() =>
  props.withDisabled ? {} : { disabled: { _eq: false } },
);

const query = graphql(`
  query Orchards($where: orchards_bool_exp = { disabled: { _eq: false } }) {
    orchards(order_by: { name: asc }, where: $where) {
      id
      name
      disabled
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  variables: { where },
});

const orchardOptions = computed(() => data.value?.orchards ?? []);

const orchard = computed({
  get: () => orchardOptions.value.find((o) => o.id === modelValue.value),
  set: (orchard) => (modelValue.value = orchard?.id ?? null),
});

function isDisabled(option: (typeof orchardOptions.value)[0]) {
  return option.disabled;
}

const { t } = useI18n();
</script>
