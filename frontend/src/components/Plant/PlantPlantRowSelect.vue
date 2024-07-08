<template>
  <EntitySelect
    :ref="plantRowRef"
    v-model="plantRow"
    :label="t('plants.fields.plantRow')"
    :options="plantRowOptions"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
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

const plantRowRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => plantRowRef.value?.validate(),
  focus: () => plantRowRef.value && focusInView(plantRowRef.value),
});

const modelValue = defineModel<number | null>({ required: true });

const query = graphql(`
  query PlantRows {
    plant_rows(where: { disabled: { _eq: false } }, order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const plantRowOptions = computed(() => data.value?.plant_rows ?? []);

const plantRow = computed<{ id: number; name: string } | undefined>({
  get: () => plantRowOptions.value.find((o) => o.id === modelValue.value),
  set: (plantRow) => (modelValue.value = plantRow?.id ?? null),
});

const { t } = useI18n();
</script>
