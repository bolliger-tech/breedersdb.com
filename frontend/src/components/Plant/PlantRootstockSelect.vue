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
  focus: () => rootstockRef.value?.focus(),
});

const modelValue = defineModel<number | null>({ required: true });

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

const rootstock = computed<{ id: number; name: string } | undefined>({
  get: () => rootstockOptions.value.find((o) => o.id === modelValue.value),
  set: (rootstock) => (modelValue.value = rootstock?.id ?? null),
});

const { t } = useI18n();
</script>
