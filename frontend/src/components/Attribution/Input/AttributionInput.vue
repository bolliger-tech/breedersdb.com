<template>
  <BaseInputLabel :label="attribute.name" style="max-width: 592px">
    <slot name="before"></slot>

    <AttributionInputRating
      v-if="attribute.data_type === 'RATING'"
      :model-value="modelValue?.integer_value ?? null"
      :validation="attribute.validation_rule"
      :legend="attribute.legend"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributionInputNumber
      v-else-if="attribute.data_type === 'INTEGER'"
      ref="integerInputRef"
      :model-value="modelValue?.integer_value ?? null"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributionInputNumber
      v-else-if="attribute.data_type === 'FLOAT'"
      ref="floatInputRef"
      :model-value="modelValue?.float_value ?? null"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ float_value: val })
      "
    />
    <AttributionInputText
      v-else-if="attribute.data_type === 'TEXT'"
      ref="textInputRef"
      :model-value="modelValue?.text_value ?? null"
      :validation="{ maxLen: 2047, pattern: null }"
      :additional-rules="[
        (value: string | null) =>
          (!textNote && !photoNote) ||
          (value !== '' && value !== null) ||
          t('attributions.add.notesMustHaveValue'),
      ]"
      @update:model-value="
        (val: string | null) => updateModelValue({ text_value: val })
      "
    />
    <AttributionInputDate
      v-else-if="attribute.data_type === 'DATE'"
      :model-value="modelValue?.date_value ?? null"
      @update:model-value="
        (val: string | null) => updateModelValue({ date_value: val })
      "
    />
    <AttributionInputBoolean
      v-else-if="attribute.data_type === 'BOOLEAN'"
      :model-value="modelValue?.boolean_value ?? null"
      @update:model-value="
        (val: boolean | null) => updateModelValue({ boolean_value: val })
      "
    />
    <AttributionInputPhoto
      v-else-if="attribute.data_type === 'PHOTO'"
      :model-value="modelValue?.photo_value ?? null"
      @update:model-value="
        (val: File | string | null) => updateModelValue({ photo_value: val })
      "
    />

    <div v-if="attribute.description" class="q-mt-sm pre-line">
      {{ attribute.description }}
    </div>

    <template v-if="!hideNotes">
      <AttributionInputNote
        ref="noteInputRef"
        v-model:photo-note="photoNote"
        v-model:text-note="textNote"
        :allow-text-note="true"
        :allow-photo-note="attribute.data_type !== 'PHOTO'"
        :disabled="hasNoValue"
      />

      <q-dialog v-model="confirm">
        <q-card>
          <q-card-section>
            <BaseMessage
              type="warning"
              :message="t('attributions.add.clearAttribute')"
              icon-size="xl"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              :label="t('base.cancel')"
              color="primary"
            />
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
    </template>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import AttributionInputRating from 'src/components/Attribution/Input/AttributionInputRating.vue';
import AttributionInputNumber from 'src/components/Attribution/Input/AttributionInputNumber.vue';
import AttributionInputText from 'src/components/Attribution/Input/AttributionInputText.vue';
import AttributionInputDate from 'src/components/Attribution/Input/AttributionInputDate.vue';
import AttributionInputBoolean from 'src/components/Attribution/Input/AttributionInputBoolean.vue';
import AttributionInputPhoto from 'src/components/Attribution/Input/AttributionInputPhoto.vue';
import AttributionInputNote from 'src/components/Attribution/Input/AttributionInputNote.vue';
import { computed, ref, nextTick, watch, onMounted, type Slot } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

export interface AttributionInputProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
  exceptional: boolean;
  hideNotes?: boolean;
}

export type AttributionInputValue =
  | {
      attribute_id?: number | null | undefined;
      boolean_value?: boolean | null | undefined;
      date_value?: string | null | undefined;
      exceptional_attribution?: boolean | null | undefined;
      float_value?: number | null | undefined;
      integer_value?: number | null | undefined;
      text_note?: string | null | undefined;
      text_value?: string | null | undefined;
      photo_value?: File | string | null | undefined;
      photo_note?: File | string | null | undefined;
    }
  | undefined;

const props = defineProps<AttributionInputProps>();

const modelValue = defineModel<AttributionInputValue>({
  required: true,
});

defineSlots<{
  before: Slot;
}>();

defineExpose({ validate, focus: focusInvalid });

const photoNote = computed({
  get: () => modelValue.value?.photo_note ?? null,
  set: (file: File | string | null) =>
    updateModelValue({ photo_note: file ?? null }),
});

const textNote = computed({
  get: () => modelValue.value?.text_note ?? null,
  set: (val: string | null) => updateModelValue({ text_note: val }),
});

const { t } = useI18n();
const confirm = ref(false);
const noteInputRef = ref<InstanceType<typeof AttributionInputNote> | null>(
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
  photo_value?: File | string | null;
  text_note?: string | null;
  photo_note?: File | string | null;
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

function setDefaultValue() {
  const { data_type, default_value } = props.attribute;
  updateModelValue({
    boolean_value: data_type === 'BOOLEAN' ? default_value : null,
    date_value: data_type === 'DATE' ? default_value : null,
    float_value: data_type === 'FLOAT' ? default_value : null,
    integer_value:
      data_type === 'INTEGER' || data_type === 'RATING' ? default_value : null,
    text_value: data_type === 'TEXT' ? default_value : null,
    photo_value: null, // default_value is not supported for photos
  });
}

// initially set default value
onMounted(() => {
  if (hasNoValue.value) setDefaultValue();
});
// update default value when editing attribute (AttributePreview.vue)
watch(() => props.attribute.default_value, setDefaultValue);

const integerInputRef = ref<InstanceType<typeof AttributionInputNumber> | null>(
  null,
);
const floatInputRef = ref<InstanceType<typeof AttributionInputNumber> | null>(
  null,
);
const textInputRef = ref<InstanceType<typeof AttributionInputText> | null>(
  null,
);

async function validate() {
  let valueIsValid: Promise<boolean> = Promise.resolve(true);

  switch (props.attribute.data_type) {
    case 'INTEGER':
      valueIsValid = Promise.resolve(
        integerInputRef.value?.validate() ?? false,
      );
      break;
    case 'FLOAT':
      valueIsValid = Promise.resolve(floatInputRef.value?.validate() ?? false);
      break;
    case 'TEXT':
      valueIsValid = Promise.resolve(textInputRef.value?.validate() ?? false);
      break;
  }

  let noteIsValid: Promise<boolean> = Promise.resolve(true);
  if (modelValue.value?.text_note) {
    noteIsValid = Promise.resolve(noteInputRef.value?.validate() ?? false);
  }

  return (await Promise.all([valueIsValid, noteIsValid])).every(Boolean);
}

function focusInvalid() {
  if (
    modelValue.value?.text_note &&
    noteInputRef.value &&
    !noteInputRef.value.validate()
  ) {
    noteInputRef.value.focus();
    return;
  }

  switch (props.attribute.data_type) {
    case 'INTEGER':
      integerInputRef.value?.focus();
      break;
    case 'FLOAT':
      floatInputRef.value?.focus();
      break;
    case 'TEXT':
      textInputRef.value?.focus();
      break;
  }
}
</script>
