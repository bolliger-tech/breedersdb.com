<template>
  <EntitySelect
    :ref="rootstockRef"
    v-model="rootstock"
    :label="t('plants.fields.rootstock')"
    :options="rootstockOptions"
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

const rootstockRef = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => rootstockRef.value?.validate(),
});

const rootstock = defineModel<{ id: number; name: string }>();

const query = graphql(`
  query Rootstocks {
    rootstocks(order_by: { name: asc }) {
      id
      name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const rootstockOptions = computed(() => data.value?.rootstocks ?? []);

const { t } = useI18n();
</script>
