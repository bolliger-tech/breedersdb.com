<template>
  <EntitySelect
    ref="cultivarRef"
    v-model="cultivar"
    :label="label || t('cultivars.title')"
    :options="cultivarOptions"
    option-value="id"
    option-label="display_name"
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

export interface CultivarSelectProps {
  required?: boolean;
  label?: string;
}
defineProps<CultivarSelectProps>();

const cultivarRef = ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null>(null);

defineExpose({
  validate: () => cultivarRef.value?.validate(),
  focus: () => cultivarRef.value && focusInView(cultivarRef.value),
});

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Cultivars {
    cultivars(order_by: { display_name: asc }) {
      id
      display_name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: 'cache-and-network',
});

const cultivarOptions = computed(() => data.value?.cultivars ?? []);

const cultivar = computed({
  get: () => cultivarOptions.value.find((o) => o.id === modelValue.value),
  set: (cultivar) => (modelValue.value = cultivar?.id ?? null),
});

const { t } = useI18n();
</script>
