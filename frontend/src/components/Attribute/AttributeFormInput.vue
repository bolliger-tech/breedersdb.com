<template>
  <BaseInputLabel :label="attribute.name" style="max-width: 592px">
    <AttributeFormInputRating
      v-if="attribute.data_type === 'RATING'"
      :model-value="modelValue?.integer_value ?? attribute.default_value"
      :validation="attribute.validation_rule"
      :legend="attribute.legend"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributeFormInputNumber
      v-else-if="attribute.data_type === 'INTEGER'"
      :model-value="modelValue?.integer_value ?? attribute.default_value"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributeFormInputNumber
      v-else-if="attribute.data_type === 'FLOAT'"
      :model-value="modelValue?.float_value ?? attribute.default_value"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ float_value: val })
      "
    />
    <AttributeFormInputText
      v-else-if="attribute.data_type === 'TEXT'"
      :model-value="modelValue?.text_value ?? attribute.default_value"
      :validation="{ maxLen: 2047, pattern: null }"
      @update:model-value="
        (val: string | null) => updateModelValue({ text_value: val })
      "
    />
    <AttributeFormInputDate
      v-else-if="attribute.data_type === 'DATE'"
      :model-value="modelValue?.date_value ?? attribute.default_value"
      @update:model-value="
        (val: string | null) => updateModelValue({ date_value: val })
      "
    />
    <AttributeFormInputBoolean
      v-else-if="attribute.data_type === 'BOOLEAN'"
      :model-value="modelValue?.boolean_value ?? attribute.default_value"
      @update:model-value="
        (val: boolean | null) => updateModelValue({ boolean_value: val })
      "
    />
    <AttributeFormInputPhoto
      v-else-if="attribute.data_type === 'PHOTO'"
      v-model="photoInput"
    />

    <div v-if="attribute.description">
      {{ attribute.description }}
    </div>

    <AttributeFormInputNote
      v-model:photo-note="photoNote"
      v-model:text-note="textNote"
      :allow-text-note="true"
      :allow-photo-note="attribute.data_type !== 'PHOTO'"
    />
  </BaseInputLabel>
</template>

<script setup lang="ts">
import type { AttributeInsertData } from 'src/components/Attribute/AttributeForm.vue';
import type { AttributeDefinition } from 'src/components/Attribute/AttributeSteps.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import AttributeFormInputRating from 'src/components/Attribute/AttributeFormInputRating.vue';
import AttributeFormInputNumber from 'src/components/Attribute/AttributeFormInputNumber.vue';
import AttributeFormInputText from 'src/components/Attribute/AttributeFormInputText.vue';
import AttributeFormInputDate from 'src/components/Attribute/AttributeFormInputDate.vue';
import AttributeFormInputBoolean from 'src/components/Attribute/AttributeFormInputBoolean.vue';
import AttributeFormInputPhoto from 'src/components/Attribute/AttributeFormInputPhoto.vue';
import AttributeFormInputNote from 'src/components/Attribute/AttributeFormInputNote.vue';
import { computed } from 'vue';

export interface AttributeFormInputProps {
  attribute: AttributeDefinition;
  exceptional: boolean;
}

const props = defineProps<AttributeFormInputProps>();

const modelValue = defineModel<AttributeInsertData | undefined>({
  required: true,
});
const photo = defineModel<File | null>('photo', { required: true });

const photoInput = computed({
  get: () => {
    const file = photo.value;
    if (
      !file ||
      props.attribute.data_type !== 'PHOTO' ||
      !modelValue.value?.text_value
    ) {
      return null;
    }
    return {
      file,
      fileName: modelValue.value?.text_value,
    };
  },
  set: (input: { file: File; fileName: string } | null) => {
    if (props.attribute.data_type !== 'PHOTO') {
      throw new Error('Invalid data type for photo input');
    }
    if (!input) {
      photo.value = null;
      updateModelValue({ text_value: null });
    } else {
      photo.value = input.file;
      updateModelValue({ text_value: input.fileName });
    }
  },
});

const photoNote = computed({
  get: () => {
    const file = photo.value;
    if (
      !file ||
      props.attribute.data_type === 'PHOTO' ||
      !modelValue.value?.photo_note
    ) {
      return null;
    }
    return {
      file,
      fileName: modelValue.value?.photo_note,
    };
  },
  set: (input: { file: File; fileName: string } | null) => {
    if (props.attribute.data_type === 'PHOTO') {
      throw new Error('Invalid data type for photo note');
    }
    photo.value = input?.file ?? null;
    if (modelValue.value) {
      modelValue.value.photo_note = input?.fileName ?? null;
    } else {
      updateModelValue({ photo_note: input?.fileName ?? null });
    }
  },
});

const textNote = computed({
  get: () => modelValue.value?.text_note ?? null,
  set: (val: string | null) => {
    if (modelValue.value) {
      modelValue.value.text_note = val;
    } else {
      updateModelValue({ text_note: val });
    }
  },
});

function updateModelValue({
  integer_value = null,
  float_value = null,
  text_value = null,
  boolean_value = null,
  date_value = null,
  text_note,
  photo_note,
}: {
  integer_value?: number | null;
  float_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  date_value?: string | null;
  text_note?: string | null | undefined;
  photo_note?: string | null | undefined;
}) {
  const model = modelValue.value ?? {
    attribute_id: props.attribute.id,
    integer_value: null,
    float_value: null,
    text_value: null,
    boolean_value: null,
    date_value: null,
    exceptional_attribution: props.exceptional,
    text_note: null,
    photo_note: null,
  };

  model.integer_value = integer_value;
  model.float_value = float_value;
  model.text_value = text_value;
  model.boolean_value = boolean_value;
  model.date_value = date_value;
  model.text_note = text_note ?? model.text_note;
  model.photo_note = photo_note ?? model.photo_note;

  modelValue.value = model;
}
</script>
