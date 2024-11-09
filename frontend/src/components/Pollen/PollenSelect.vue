<template>
  <EntitySelect
    ref="pollenRef"
    v-model="pollen"
    :label="t('pollen.title')"
    :options="pollenOptions"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
    :required="required"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';

export interface PollenSelectProps {
  required?: boolean;
  includeId?: number;
}
defineProps<PollenSelectProps>();

const pollenRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => pollenRef.value?.validate(),
  focus: () => pollenRef.value && focusInView(pollenRef.value),
});

export type PollenSelectPollen = typeof pollen.value;
const emit = defineEmits<{
  pollenChanged: [plant: PollenSelectPollen];
}>();

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Pollen {
    pollen(order_by: { name: asc }) {
      id
      name
      cultivar {
        id
        display_name
      }
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['pollen'] },
});

const pollenOptions = computed(() => data.value?.pollen ?? []);

const pollen = computed({
  get: () => pollenOptions.value.find((o) => o.id === modelValue.value),
  set: (pollen) => (modelValue.value = pollen?.id ?? null),
});

watch(pollen, (newPollen) => emit('pollenChanged', newPollen));

const { t } = useI18n();
</script>
