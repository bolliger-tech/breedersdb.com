<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string | null | undefined) =>
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
    trim
  />
  <EntityInput
    v-model.trim="data.description"
    :label="t('attributionForms.columns.description')"
    type="textarea"
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 255 || t('base.validation.maxLen', { x: 255 }),
    ]"
  />
  <EntityToggle
    :ref="(el: InputRef) => (refs.disabledRef = el)"
    v-model="data.disabled"
    required
    :label="t('entity.commonColumns.disabled')"
    :explainer="t('attributionForms.disableExplainer')"
  />

  <h3 class="q-mb-md">
    {{ t('attributionForms.columns.fields') }}&nbsp;
    <BaseExplainer>{{ t('attributionForms.fieldsExplainer') }}</BaseExplainer>
  </h3>

  <AttributionFormSortableAttributeSelect
    v-for="(formField, index) in data.attribution_form_fields"
    :key="formField.id"
    v-model="formField.attribute"
    :drop-zone-active="currentDragItemId !== null"
    :not-draggable="data.attribution_form_fields.length < 2"
    :no-space-before="data.attribution_form_fields.length < 2"
    @dragstart="currentDragItemId = index"
    @dragend="currentDragItemId = null"
    @drop="(pos) => onDrop(pos, index)"
    @delete="data.attribution_form_fields.splice(index, 1)"
  />
  <AttributeSelect
    :key="data.attribution_form_fields.length"
    :label="t('attributionForms.addField')"
    @update:model-value="addFormField"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import EntityToggle from '../Entity/Edit/EntityToggle.vue';
import BaseExplainer from 'src/components/Base/BaseExplainer.vue';
import AttributionFormSortableAttributeSelect from './AttributionFormSortableAttributeSelect.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import type {
  AttributionFormInsertInput,
  AttributionFormModalEditProps,
} from './AttributionFormModalEdit.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useIsUnique } from 'src/composables/useIsUnique';
import { extend } from 'quasar';
import { type AttributeFragment } from 'src/components/Attribute/attributeFragment';
import AttributeSelect from 'src/components/Attribute/AttributeSelect.vue';

export interface AttributionFormEntityFormProps {
  attributionForm: AttributionFormModalEditProps['attributionForm'];
}

const props = defineProps<AttributionFormEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.attributionForm.name,
  description: props.attributionForm.description,
  disabled: props.attributionForm.disabled,
  attribution_form_fields: props.attributionForm.attribution_form_fields,
} as AttributionFormInsertInput;

const data = ref<AttributionFormInsertInput>(extend(true, {}, initialData));

const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
  descriptionRef: null,
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
  tableName: 'attribution_forms',
  existingId:
    ('id' in props.attributionForm && props.attributionForm.id) || undefined,
});

const { t } = useI18n();

const currentDragItemId = ref<number | null>(null);

function onDrop(pos: 'before' | 'after', dropIndex: number) {
  if (currentDragItemId.value === null) return;

  // set the array order
  const dragIndex = currentDragItemId.value;
  const dragItem = data.value.attribution_form_fields[dragIndex];
  if (!dragItem) throw new Error('Drag item not found');
  if (dragIndex < dropIndex) dropIndex--;
  data.value.attribution_form_fields.splice(dragIndex, 1);
  data.value.attribution_form_fields.splice(
    dropIndex + (pos === 'after' ? 1 : 0),
    0,
    dragItem,
  );
}

const addedFormFields = ref(1);

function addFormField(attribute: AttributeFragment | null | undefined) {
  if (!attribute) return;

  addedFormFields.value++;
  data.value.attribution_form_fields.push({
    id: -addedFormFields.value,
    attribute,
    priority: data.value.attribution_form_fields.length,
  });
}
</script>
