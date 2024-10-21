<template>
  <BaseInputLabel :label="attribute.name" style="max-width: 592px">
    <BaseMessage
      v-if="hasSameAgain"
      type="warning"
      :message="t('attributions.add.sameAgainWarning')"
    />

    <AttributionAddFormInputRating
      v-if="attribute.data_type === 'RATING'"
      :model-value="modelValue?.integer_value ?? null"
      :validation="attribute.validation_rule"
      :legend="attribute.legend"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributionAddFormInputNumber
      v-else-if="attribute.data_type === 'INTEGER'"
      ref="integerInputRef"
      :model-value="modelValue?.integer_value ?? null"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ integer_value: val })
      "
    />
    <AttributionAddFormInputNumber
      v-else-if="attribute.data_type === 'FLOAT'"
      ref="floatInputRef"
      :model-value="modelValue?.float_value ?? null"
      :validation="attribute.validation_rule"
      @update:model-value="
        (val: number | null) => updateModelValue({ float_value: val })
      "
    />
    <AttributionAddFormInputText
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
    <AttributionAddFormInputDate
      v-else-if="attribute.data_type === 'DATE'"
      :model-value="modelValue?.date_value ?? null"
      @update:model-value="
        (val: string | null) => updateModelValue({ date_value: val })
      "
    />
    <AttributionAddFormInputBoolean
      v-else-if="attribute.data_type === 'BOOLEAN'"
      :model-value="modelValue?.boolean_value ?? null"
      @update:model-value="
        (val: boolean | null) => updateModelValue({ boolean_value: val })
      "
    />
    <AttributionAddFormInputPhoto
      v-else-if="attribute.data_type === 'PHOTO'"
      :model-value="modelValue?.photo_value ?? null"
      @update:model-value="
        (val: File | null) => updateModelValue({ photo_value: val })
      "
    />

    <div
      v-if="attribute.description"
      style="word-wrap: break-word; white-space: pre-line"
      class="q-mt-sm"
    >
      {{ attribute.description }}
    </div>

    <template v-if="!hideNotes">
      <AttributionAddFormInputNote
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
import type { AttributionValueWithPhoto } from 'src/components/Attribution/Add/AttributionAddForm.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import AttributionAddFormInputRating from 'src/components/Attribution/Add/AttributionAddFormInputRating.vue';
import AttributionAddFormInputNumber from 'src/components/Attribution/Add/AttributionAddFormInputNumber.vue';
import AttributionAddFormInputText from 'src/components/Attribution/Add/AttributionAddFormInputText.vue';
import AttributionAddFormInputDate from 'src/components/Attribution/Add/AttributionAddFormInputDate.vue';
import AttributionAddFormInputBoolean from 'src/components/Attribution/Add/AttributionAddFormInputBoolean.vue';
import AttributionAddFormInputPhoto from 'src/components/Attribution/Add/AttributionAddFormInputPhoto.vue';
import AttributionAddFormInputNote from 'src/components/Attribution/Add/AttributionAddFormInputNote.vue';
import { computed, ref, nextTick } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

export interface AttributionAddFormInputProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
  exceptional: boolean;
  hasSameAgain: boolean;
  hideNotes?: boolean;
}

const props = defineProps<AttributionAddFormInputProps>();

const modelValue = defineModel<AttributionValueWithPhoto | undefined>({
  required: true,
});

defineExpose({ validate, focus: focusInvalid });

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
const noteInputRef = ref<InstanceType<
  typeof AttributionAddFormInputNote
> | null>(null);

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

const integerInputRef = ref<InstanceType<
  typeof AttributionAddFormInputNumber
> | null>(null);
const floatInputRef = ref<InstanceType<
  typeof AttributionAddFormInputNumber
> | null>(null);
const textInputRef = ref<InstanceType<
  typeof AttributionAddFormInputText
> | null>(null);

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
