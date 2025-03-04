<template>
  <EntitySelect
    ref="cultivarRef"
    v-model="cultivar"
    :label="label || t('cultivars.title')"
    :options="cultivarOptions"
    option-value="id"
    option-label="display_name"
    :loading="fetching || loading"
    :error="error"
    :required="required"
    :rules="rules"
    :hint="hint"
    :disable="disable"
    :readonly="readonly"
    filter-with-wildcards-around-dots
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import type { EntitySelectProps } from '../Entity/Edit/EntitySelect.vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';

export type CultivarSelectCultivar = typeof cultivar.value;

export interface CultivarSelectProps {
  required?: boolean;
  label?: string;
  rules?: EntitySelectProps<unknown>['rules'];
  readonly?: EntitySelectProps<unknown>['readonly'];
  disable?: EntitySelectProps<unknown>['disable'];
  hint?: EntitySelectProps<unknown>['hint'];
  loading?: boolean;
  requestPolicy?: Parameters<typeof useQuery>[0]['requestPolicy'];
  autocreate?: boolean;
}
const props = defineProps<CultivarSelectProps>();

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
  requestPolicy: props.requestPolicy ?? 'cache-and-network',
  context: { additionalTypenames: ['cultivars'] },
});

const cultivarOptions = computed(() => data.value?.cultivars ?? []);

const cultivar = computed({
  get: () => cultivarOptions.value.find((o) => o.id === modelValue.value),
  set: (cultivar) => (modelValue.value = cultivar?.id ?? null),
});

const { t } = useI18n();
</script>
