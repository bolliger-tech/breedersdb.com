<template>
  <EntitySelect
    :ref="orchardRef"
    v-model="orchard"
    :label="t('orchards.title')"
    :options="orchardOptions"
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

const orchardRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => orchardRef.value?.validate(),
  focus: () => orchardRef.value && focusInView(orchardRef.value),
});

const modelValue = defineModel<number | null>({ required: true });

const query = graphql(`
  query Orchards {
    orchards(order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const orchardOptions = computed(() => data.value?.orchards ?? []);

const orchard = computed<{ id: number; name: string } | undefined>({
  get: () => orchardOptions.value.find((o) => o.id === modelValue.value),
  set: (orchard) => (modelValue.value = orchard?.id ?? null),
});

const { t } = useI18n();
</script>
