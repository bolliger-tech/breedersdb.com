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

const plantRowRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => plantRowRef.value?.validate(),
});

const plantRow = defineModel<{ id: number; name: string }>();

const query = graphql(`
  query PlantRows {
    plant_rows(where: { disabled: { _eq: false } }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const plantRowOptions = computed(() => data.value?.plant_rows ?? []);

const { t } = useI18n();
</script>
