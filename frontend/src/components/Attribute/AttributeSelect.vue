<template>
  <EntitySelect
    :ref="inputRef"
    v-model="modelValue"
    :label="t('attribute.title', 1)"
    :options="attributeOptions"
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
import { attributeFragment, type AttributeFragment } from './attributeFragment';

const inputRef = ref<EntitySelectInstance<AttributeFragment> | null>(null);

defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const modelValue = defineModel<AttributeFragment | null | undefined>();

const query = graphql(
  `
    query Attributes {
      attributes(where: { disabled: { _eq: false } }, order_by: { name: asc }) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const { data, error, fetching } = useQuery({
  query,
});

const attributeOptions = computed(
  () => (data.value?.attributes ?? []) as AttributeFragment[],
);

const { t } = useI18n();
</script>
