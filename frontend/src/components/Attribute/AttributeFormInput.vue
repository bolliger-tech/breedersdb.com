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
      :model-value="modelValue?.photo_value ?? null"
      @update:model-value="
        (val: File | null) => updateModelValue({ photo_value: val })
      "
    />

    <div v-if="attribute.description">
      {{ attribute.description }}
    </div>

    <AttributeFormInputNote
      ref="noteInputRef"
      v-model:photo-note="photoNote"
      v-model:text-note="textNote"
      :allow-text-note="true"
      :allow-photo-note="attribute.data_type !== 'PHOTO'"
      :disabled="hasNoValue"
    />

    <q-dialog v-model="confirm">
      <q-card>
        <q-card-section class="row items-center no-wrap">
          <q-icon name="warning" color="negative" size="xl" />
          <p class="q-ma-none q-ml-md">{{ t('attribute.clearAttribute') }}</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('base.cancel')" color="primary" />
          <q-btn
            flat
            :label="t('base.delete')"
            color="negative"
            @click="
              clearModelValue();
              confirm = false;
            "
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import type { AttributeValueWithPhoto } from 'src/components/Attribute/AttributeForm.vue';
import type { AttributeDefinition } from 'src/components/Attribute/AttributeSteps.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import AttributeFormInputRating from 'src/components/Attribute/AttributeFormInputRating.vue';
import AttributeFormInputNumber from 'src/components/Attribute/AttributeFormInputNumber.vue';
import AttributeFormInputText from 'src/components/Attribute/AttributeFormInputText.vue';
import AttributeFormInputDate from 'src/components/Attribute/AttributeFormInputDate.vue';
import AttributeFormInputBoolean from 'src/components/Attribute/AttributeFormInputBoolean.vue';
import AttributeFormInputPhoto from 'src/components/Attribute/AttributeFormInputPhoto.vue';
import AttributeFormInputNote from 'src/components/Attribute/AttributeFormInputNote.vue';
import { computed, ref, nextTick } from 'vue';
import { useI18n } from 'src/composables/useI18n';

export interface AttributeFormInputProps {
  attribute: AttributeDefinition;
  exceptional: boolean;
}

const props = defineProps<AttributeFormInputProps>();

const modelValue = defineModel<AttributeValueWithPhoto | undefined>({
  required: true,
});

const photoNote = computed({
  get: () => modelValue.value?.photo_note ?? null,
  set: (file: File | null) => updateModelValue({ photo_note: file ?? null }),
});

const textNote = computed({
  get: () => modelValue.value?.text_note ?? null,
  set: (val: string | null) => updateModelValue({ text_note: val }),
});

const { t } = useI18n();
const confirm = ref(false);
const noteInputRef = ref<InstanceType<typeof AttributeFormInputNote> | null>(
  null,
);

async function clearModelValue() {
  if (!modelValue.value) {
    return;
  }

  modelValue.value.integer_value = null;
  modelValue.value.float_value = null;
  modelValue.value.text_value = null;
  modelValue.value.boolean_value = null;
  modelValue.value.date_value = null;
  modelValue.value.photo_value = null;
  modelValue.value.text_note = null;
  modelValue.value.photo_note = null;
  noteInputRef.value?.clear();

  if (document.activeElement instanceof HTMLElement) {
    // required to reset state of star ratings
    await nextTick();
    document.activeElement.blur();
  }
}

function updateModelValue({
  integer_value,
  float_value,
  text_value,
  boolean_value,
  date_value,
  photo_value,
  text_note,
  photo_note,
}: {
  integer_value?: number | null;
  float_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  date_value?: string | null;
  photo_value?: File | null;
  text_note?: string | null;
  photo_note?: File | null;
}) {
  const model = modelValue.value ?? {
    attribute_id: props.attribute.id,
    integer_value: null,
    float_value: null,
    text_value: null,
    boolean_value: null,
    date_value: null,
    photo_value: null,
    exceptional_attribution: props.exceptional,
    text_note: null,
    photo_note: null,
  };

  if (
    (integer_value === null ||
      float_value === null ||
      text_value === null ||
      boolean_value === null ||
      date_value === null ||
      photo_value === null) &&
    (model.text_note || model.photo_note)
  ) {
    confirm.value = true;
    return;
  }

  model.integer_value =
    integer_value === undefined ? model.integer_value : integer_value;
  model.float_value =
    float_value === undefined ? model.float_value : float_value;
  model.text_value = text_value === undefined ? model.text_value : text_value;
  model.boolean_value =
    boolean_value === undefined ? model.boolean_value : boolean_value;
  model.date_value = date_value === undefined ? model.date_value : date_value;
  model.photo_value =
    photo_value === undefined ? model.photo_value : photo_value;
  model.text_note = text_note === undefined ? model.text_note : text_note;
  model.photo_note = photo_note === undefined ? model.photo_note : photo_note;

  modelValue.value = model;
}

const hasNoValue = computed(() => {
  return (
    !modelValue.value ||
    (modelValue.value.integer_value === null &&
      modelValue.value.float_value === null &&
      modelValue.value.text_value === null &&
      modelValue.value.boolean_value === null &&
      modelValue.value.date_value === null &&
      modelValue.value.photo_value === null)
  );
});
</script>
