<template>
  <EntitySelect
    ref="motherPlantRef"
    v-model="motherPlant"
    :label="t('motherPlants.title')"
    :options="motherPlantOptions"
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
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { ComponentExposed } from 'vue-component-type-helpers';

export interface MotherPlantSelectProps {
  required?: boolean;
}
defineProps<MotherPlantSelectProps>();

const motherPlantRef = ref<ComponentExposed<typeof EntitySelect> | null>(null);

defineExpose({
  validate: () => motherPlantRef.value?.validate(),
  focus: () => motherPlantRef.value && focusInView(motherPlantRef.value),
});

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query MotherPlants {
    mother_plants(order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['mother_plants'] },
});

const motherPlantOptions = computed(() => data.value?.mother_plants ?? []);

const motherPlant = computed({
  get: () => motherPlantOptions.value.find((o) => o.id === modelValue.value),
  set: (motherPlant) => (modelValue.value = motherPlant?.id ?? null),
});

const { t } = useI18n();
</script>
