<template>
  <EntitySelect
    ref="attributeDataTypeRef"
    v-model="attributeDataType"
    :label="t('attributes.columns.dataType')"
    :options="attributeDataTypeOptions"
    option-value="value"
    option-label="label"
    :required="required"
    :clearable="false"
    :loading="fetching"
    :rules="[
      async (val: OptionType | null | undefined) =>
        !attributeId ||
        val?.value === initialDataType ||
        !(await hasAttributions()) ||
        t('attributes.dataTypeChangeNotAllowed'),
    ]"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { ref, computed } from 'vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { AttributeDataTypes } from 'src/graphql';

type OptionType = {
  value: string;
  label: string;
};

export interface AttributeDataTypeSelectProps {
  required?: boolean;
  initialDataType: AttributeDataTypes;
  attributeId?: number;
}

const props = defineProps<AttributeDataTypeSelectProps>();

const attributeDataTypeRef = ref<EntitySelectInstance<OptionType> | null>(null);

defineExpose({
  validate: () => attributeDataTypeRef.value?.validate(),
  focus: () =>
    attributeDataTypeRef.value && focusInView(attributeDataTypeRef.value),
});

const modelValue = defineModel<AttributeDataTypes | null>({ required: true });

const { t } = useI18n();

const attributeDataTypeOptions: { value: AttributeDataTypes; label: string }[] =
  [
    { value: 'TEXT', label: t('attributes.dataTypes.text') },
    { value: 'INTEGER', label: t('attributes.dataTypes.integer') },
    { value: 'FLOAT', label: t('attributes.dataTypes.float') },
    { value: 'BOOLEAN', label: t('attributes.dataTypes.boolean') },
    { value: 'DATE', label: t('attributes.dataTypes.date') },
    { value: 'PHOTO', label: t('attributes.dataTypes.photo') },
    { value: 'RATING', label: t('attributes.dataTypes.rating') },
  ];

const attributeDataType = computed({
  get: () => attributeDataTypeOptions.find((o) => o.value === modelValue.value),
  set: (attributeDataType) =>
    (modelValue.value = attributeDataType?.value ?? null),
});

const query = graphql(`
  query AttributeHasAttributions($attributeId: Int!) {
    attribution_values_aggregate(
      where: { attribute_id: { _eq: $attributeId } }
    ) {
      aggregate {
        count
      }
    }
  }
`);

const variables = computed(() => ({ attributeId: props.attributeId }));

const { executeQuery, fetching } = useQuery({
  query,
  variables,
  pause: true,
});

async function hasAttributions() {
  if (!props.attributeId) {
    return false;
  }
  const result = await executeQuery();
  if (result.error.value) {
    console.error(result.error);
    return false;
  }
  const count =
    result.data?.value?.attribution_values_aggregate.aggregate?.count;
  return !!count;
}
</script>
