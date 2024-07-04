<template>
  <EntitySelect
    ref="plantGroupRef"
    v-model="plantGroup"
    :label="t('plants.fields.plantGroup')"
    :options="plantGroupOptions"
    option-value="id"
    option-label="display_name"
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

const plantGroupRef = ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null>(null);

defineExpose({
  validate: () => plantGroupRef.value?.validate(),
  focus: () => plantGroupRef.value?.focus(),
});

const modelValue = defineModel<number | null>({ required: true });

const query = graphql(`
  query PlantGroups {
    plant_groups(
      where: { disabled: { _eq: false } }
      order_by: { display_name: asc }
    ) {
      id
      display_name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const plantGroupOptions = computed(() => data.value?.plant_groups ?? []);

const plantGroup = computed<{ id: number; display_name: string } | undefined>({
  get: () => plantGroupOptions.value.find((o) => o.id === modelValue.value),
  set: (plantGroup) => (modelValue.value = plantGroup?.id ?? null),
});

const { t } = useI18n();
</script>
