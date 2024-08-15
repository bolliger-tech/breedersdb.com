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

export interface CrossingSelectProps {
  required?: boolean;
}
defineProps<CrossingSelectProps>();

const crossingRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => crossingRef.value?.validate(),
  focus: () => crossingRef.value && focusInView(crossingRef.value),
});

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Crossings {
    crossings(order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: 'cache-and-network',
});

const crossingOptions = computed(() => data.value?.crossings ?? []);

const crossing = computed({
  get: () => crossingOptions.value.find((o) => o.id === modelValue.value),
  set: (crossing) => (modelValue.value = crossing?.id ?? null),
});

const { t } = useI18n();
</script>
