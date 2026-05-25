<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.name = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      (val: string) =>
        /^[^\n]{1,45}$/.test(val) ||
        t('base.validation.noNewLinesMaxLength', { max: 45 }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    required
    trim
    :loading="fetchingNameUnique"
  />
  <AttributeDataTypeSelect
    :ref="(el: InputRef) => (refs.attributeDataType = el)"
    :model-value="data.data_type"
    required
    :initial-data-type="initialData.data_type"
    :attribute-id="'id' in attribute ? attribute.id : undefined"
    @update:model-value="
      (val) => {
        if (val) {
          data.default_value = null;
          data.data_type = val;
        }
      }
    "
  />
  <AttributeValidationRuleInput
    v-model="data.validation_rule"
    v-model:step-ref="refs.step"
    v-model:min-ref="refs.min"
    v-model:max-ref="refs.max"
    :data-type="data.data_type"
  />
  <AttributeLegendInput
    :ref="(el: InputRef) => (refs.legend = el)"
    v-model="data.legend"
    :data-type="data.data_type"
    :validation-rule="data.validation_rule"
    :initial-data="initialData.legend"
  />
  <AttributeDefaultValueInput
    v-model="data.default_value"
    v-model:input-ref="refs.defaultValue"
    :data-type="data.data_type"
    :validation-rule="data.validation_rule"
  />
  <AttributeEnumOptionsInput
    v-if="data.data_type === 'ENUM'"
    :ref="(el: InputRef) => (refs.enumOptions = el)"
    v-model="data.enum_options"
    :attribute-id="'id' in attribute ? attribute.id : undefined"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.description = el)"
    v-model.trim="data.description"
    :label="t('attributes.columns.description')"
    type="textarea"
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 255 || t('base.validation.maxLen', { x: 255 }),
    ]"
  />
  <AttributeTypeSelect
    :ref="(el: InputRef) => (refs.attributeType = el)"
    v-model="data.attribute_type"
    required
  />
  <EntityToggle
    :ref="(el: InputRef) => (refs.disabled = el)"
    v-model="data.disabled"
    required
    :label="t('entity.commonColumns.disabled')"
    :explainer="t('attributes.disableExplainer')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { watch, ref } from 'vue';
import { extend } from 'quasar';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import EntityToggle from '../Entity/Edit/EntityToggle.vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import type { AttributeModalEditProps } from './AttributeModalEdit.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import AttributeDataTypeSelect from './AttributeDataTypeSelect.vue';
import AttributeTypeSelect from './AttributeTypeSelect.vue';
import AttributeValidationRuleInput from './AttributeValidationRuleInput.vue';
import AttributeLegendInput from './AttributeLegendInput.vue';
import AttributeDefaultValueInput from './AttributeDefaultValueInput.vue';
import AttributeEnumOptionsInput from './AttributeEnumOptionsInput.vue';
import type { EnumOptionInput } from './enumOption';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

type Attribute = AttributeModalEditProps['attribute'];

// While editing, enum options can be unsaved (no `id`) and carry a transient `_uid`,
// so the form's working copy uses `EnumOptionInput` instead of the stricter server
// shape on `Attribute`. The parent reconciles this when transforming the emitted
// data into mutation variables.
type AttributeFormData = DistributiveOmit<Attribute, 'enum_options'> & {
  enum_options: EnumOptionInput[];
};

export interface AttributeEntityFormProps {
  attribute: Attribute;
}

const props = defineProps<AttributeEntityFormProps>();
const emits = defineEmits<{
  change: [data: AttributeFormData];
}>();
// for defineExpose() see below

const initialData = {
  name: props.attribute.name,
  validation_rule: props.attribute.validation_rule,
  data_type: props.attribute.data_type,
  description: props.attribute.description,
  attribute_type: props.attribute.attribute_type,
  disabled: props.attribute.disabled,
  legend: props.attribute.legend,
  default_value: props.attribute.default_value,
  enum_options: props.attribute.enum_options,
} as AttributeFormData;

const data = ref<AttributeFormData>(extend(true, {}, initialData));

const refs = ref<{ [key: string]: InputRef | null }>({
  name: null,
  attributeDataType: null,
  step: null,
  min: null,
  max: null,
  defaultValue: null,
  legend: null,
  enumOptions: null,
  description: null,
  attributeType: null,
  disabled: null,
});

const { isDirty, validate } = useEntityForm({
  refs,
  data,
  initialData,
});

defineExpose({ validate });

const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
watch(isDirty, () => makeModalPersistent(isDirty.value));

watch(data, (newData) => emits('change', newData), { deep: true });

const { isUnique: isNameUnique, fetching: fetchingNameUnique } = useIsUnique({
  tableName: 'attributes',
  existingId: ('id' in props.attribute && props.attribute.id) || undefined,
});

const { t } = useI18n();
</script>
