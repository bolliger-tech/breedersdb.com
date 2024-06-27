<template>
  <EntitySelect
    :ref="graftingRef"
    v-model="grafting"
    :label="t('plants.fields.grafting')"
    :options="graftingOptions"
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

const graftingRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => graftingRef.value?.validate(),
});

const grafting = defineModel<{ id: number; name: string } | null | undefined>();

const query = graphql(`
  query Graftings {
    graftings(order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const graftingOptions = computed(() => data.value?.graftings ?? []);

const { t } = useI18n();
</script>
