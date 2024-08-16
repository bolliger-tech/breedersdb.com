<template>
  <EntitySelect
    ref="lotRef"
    v-model="lot"
    :label="t('lots.title')"
    :options="lotOptions"
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

export interface LotSelectProps {
  required?: boolean;
}
defineProps<LotSelectProps>();

const lotRef = ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null>(null);

defineExpose({
  validate: () => lotRef.value?.validate(),
  focus: () => lotRef.value && focusInView(lotRef.value),
});

const modelValue = defineModel<number | null | undefined>({ required: true });

const query = graphql(`
  query Lots {
    lots(order_by: { display_name: asc }) {
      id
      display_name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  requestPolicy: 'cache-and-network',
});

const lotOptions = computed(() => data.value?.lots ?? []);

const lot = computed({
  get: () => lotOptions.value.find((o) => o.id === modelValue.value),
  set: (lot) => (modelValue.value = lot?.id ?? null),
});

const { t } = useI18n();
</script>
