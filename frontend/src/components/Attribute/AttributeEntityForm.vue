<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
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
    :loading="fetchingNameUnique"
  />
  <AttributeDataTypeSelect
    :ref="(el: InputRef) => (refs.attributeDataTypeRef = el)"
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
    v-model:step-ref="refs.stepRef"
    v-model:min-ref="refs.minRef"
    v-model:max-ref="refs.maxRef"
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
    v-model:inputRef="refs.defaultValueRef"
    :data-type="data.data_type"
    :validation-rule="data.validation_rule"
  />
  <EntityInput
    v-model.trim="data.description"
    :label="t('attributes.columns.description')"
    type="textarea"
  />
  <AttributeTypeSelect
    :ref="(el: InputRef) => (refs.attributeTypeRef = el)"
    v-model="data.attribute_type"
    required
  />
  <EntityToggle
    :ref="(el: InputRef) => (refs.disabledRef = el)"
    v-model="data.disabled"
    required
    :label="t('entity.commonColumns.disabled')"
    :explainer="t('attributes.disableExplainer')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import EntityToggle from '../Entity/Edit/EntityToggle.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  AttributeEditInput,
  AttributeInsertInput,
} from './AttributeModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import AttributeDataTypeSelect from './AttributeDataTypeSelect.vue';
import AttributeTypeSelect from './AttributeTypeSelect.vue';
import AttributeValidationRuleInput from './AttributeValidationRuleInput.vue';
import AttributeLegendInput from './AttributeLegendInput.vue';
import AttributeDefaultValueInput from './AttributeDefaultValueInput.vue';
import { extend } from 'quasar';

export interface AttributeEntityFormProps {
  attribute: AttributeInsertInput | AttributeEditInput;
}

const props = defineProps<AttributeEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
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
} as AttributeInsertInput;

const data = ref<AttributeInsertInput>(extend(true, {}, initialData));

const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
  attributeDataTypeRef: null,
  stepRef: null,
  minRef: null,
  maxRef: null,
  defaultValueRef: null,
  legend: null,
  // description: there is no need to validate, so no ref here
  attributeTypeRef: null,
  disabledRef: null,
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
