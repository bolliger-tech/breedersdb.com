<template>
  <BaseInputLabel style="max-width: 592px">
    <template #label>
      <span>
        {{ attribute.name
        }}<span v-if="required" style="color: var(--q-primary)">&nbsp;*</span>
      </span>
    </template>
    <template v-if="$slots['label-action']" #label-action>
      <slot name="label-action"></slot>
    </template>
    <slot name="before"></slot>

    <div
      :inert="!!disable"
      :aria-disabled="!!disable"
      :class="{ 'attribution-input--disabled-controls': disable }"
    >
      <AttributionInputRating
        v-if="attribute.data_type === 'RATING'"
        :model-value="shownValue?.integer_value ?? null"
        :validation="attribute.validation_rule"
        :legend="attribute.legend"
        @update:model-value="
          (val: number | null) => updateModelValue({ integer_value: val })
        "
      />
      <AttributionInputNumber
        v-else-if="attribute.data_type === 'INTEGER'"
        ref="integerInputRef"
        :model-value="shownValue?.integer_value ?? null"
        :validation="attribute.validation_rule"
        @update:model-value="
          (val: number | null) => updateModelValue({ integer_value: val })
        "
      >
        <template v-if="$slots.hint" #hint>
          <slot name="hint"></slot>
        </template>
      </AttributionInputNumber>
      <AttributionInputNumber
        v-else-if="attribute.data_type === 'FLOAT'"
        ref="floatInputRef"
        :model-value="shownValue?.float_value ?? null"
        :validation="attribute.validation_rule"
        @update:model-value="
          (val: number | null) => updateModelValue({ float_value: val })
        "
      >
        <template v-if="$slots.hint" #hint>
          <slot name="hint"></slot>
        </template>
      </AttributionInputNumber>
      <AttributionInputText
        v-else-if="attribute.data_type === 'TEXT'"
        ref="textInputRef"
        :model-value="shownValue?.text_value ?? null"
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
      >
        <template v-if="$slots.hint" #hint>
          <slot name="hint"></slot>
        </template>
      </AttributionInputText>
      <AttributionInputDate
        v-else-if="attribute.data_type === 'DATE'"
        :model-value="shownValue?.date_value ?? null"
        @update:model-value="
          (val: string | null) => updateModelValue({ date_value: val })
        "
      />
      <AttributionInputBoolean
        v-else-if="attribute.data_type === 'BOOLEAN'"
        :model-value="shownValue?.boolean_value ?? null"
        @update:model-value="
          (val: boolean | null) => updateModelValue({ boolean_value: val })
        "
      />
      <AttributionInputPhoto
        v-else-if="attribute.data_type === 'PHOTO'"
        :model-value="shownValue?.photo_value ?? null"
        @update:model-value="
          (val: File | string | null) => updateModelValue({ photo_value: val })
        "
      />
      <AttributionInputAttachment
        v-else-if="attribute.data_type === 'ATTACHMENT'"
        :model-value="shownValue?.attachment_value ?? null"
        :attribute-name="attribute.name"
        :entity-name="entityName"
        :date-attributed="dateAttributed"
        @update:model-value="
          (val: File | string | null) =>
            updateModelValue({ attachment_value: val })
        "
      />
      <AttributionInputEnum
        v-else-if="attribute.data_type === 'ENUM'"
        ref="enumInputRef"
        :options="attribute.enum_options"
        :model-value="shownValue?.attribute_enum_option_id ?? null"
        @update:model-value="
          (val: number | null) =>
            updateModelValue({ attribute_enum_option_id: val })
        "
      >
        <template v-if="$slots.hint" #hint>
          <slot name="hint"></slot>
        </template>
      </AttributionInputEnum>
      <div v-if="$slots.hint && !hasFieldHint" class="attribution-input__hint">
        <slot name="hint"></slot>
      </div>

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
    </div>
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
import AttributionInputAttachment from 'src/components/Attribution/Input/AttributionInputAttachment.vue';
import AttributionInputEnum from 'src/components/Attribution/Input/AttributionInputEnum.vue';
import AttributionInputNote from 'src/components/Attribution/Input/AttributionInputNote.vue';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';
import { computed, ref, nextTick, watch, onMounted, type Slot } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

export interface AttributionInputProps {
  attribute: DistributiveOmit<AttributeFragment, 'created' | 'modified'>;
  exceptional: boolean;
  required: boolean;
  hideNotes?: boolean;
  disable?: boolean;
  // shown instead of the model value, e.g. an existing value that blocks input
  displayValue?: AttributionInputValue;
  // only used to name an already stored attachment
  entityName?: string | undefined;
  dateAttributed?: string | undefined;
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
      attachment_value?: File | string | null | undefined;
      photo_note?: File | string | null | undefined;
      attribute_enum_option_id?: number | null | undefined;
    }
  | undefined;

const props = defineProps<AttributionInputProps>();

const modelValue = defineModel<AttributionInputValue>({
  required: true,
});

defineSlots<{
  before: Slot;
  hint: Slot;
  'label-action': Slot;
}>();

defineExpose({ validate, focus: focusInvalid });

// these inputs show the hint in the bottom row of their Quasar field
const hasFieldHint = computed(() =>
  ['INTEGER', 'FLOAT', 'TEXT', 'ENUM'].includes(props.attribute.data_type),
);

const shownValue = computed(() => props.displayValue ?? modelValue.value);

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
  modelValue.value.attachment_value = null;
  modelValue.value.attribute_enum_option_id = null;
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
  attachment_value,
  attribute_enum_option_id,
  text_note,
  photo_note,
}: {
  integer_value?: number | null;
  float_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  date_value?: string | null;
  photo_value?: File | string | null;
  attachment_value?: File | string | null;
  attribute_enum_option_id?: number | null;
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
    attachment_value: null,
    attribute_enum_option_id: null,
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
      photo_value === null ||
      attachment_value === null ||
      attribute_enum_option_id === null) &&
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
  model.attachment_value =
    attachment_value === undefined ? model.attachment_value : attachment_value;
  model.attribute_enum_option_id =
    attribute_enum_option_id === undefined
      ? model.attribute_enum_option_id
      : attribute_enum_option_id;
  model.text_note = text_note === undefined ? model.text_note : text_note;
  model.photo_note = photo_note === undefined ? model.photo_note : photo_note;

  modelValue.value = model;
}

const hasNoValue = computed(() => {
  return !modelValue.value || !attributionValueHasValue(modelValue.value);
});

function setDefaultValue() {
  const { data_type, default_value } = props.attribute;
  const enumDefaultId =
    data_type === 'ENUM'
      ? (props.attribute.enum_options.find((o) => o.is_default)?.id ?? null)
      : null;
  updateModelValue({
    boolean_value: data_type === 'BOOLEAN' ? default_value : null,
    date_value: data_type === 'DATE' ? default_value : null,
    float_value: data_type === 'FLOAT' ? default_value : null,
    integer_value:
      data_type === 'INTEGER' || data_type === 'RATING' ? default_value : null,
    text_value: data_type === 'TEXT' ? default_value : null,
    photo_value: null, // default_value is not supported for photos
    attachment_value: null, // nor for attachments
    attribute_enum_option_id: enumDefaultId,
  });
}

// initially set default value
onMounted(() => {
  if (hasNoValue.value) setDefaultValue();
});
// update default value when editing attribute (AttributePreview.vue)
watch(() => props.attribute.default_value, setDefaultValue);
watch(
  () =>
    props.attribute.data_type === 'ENUM'
      ? props.attribute.enum_options
      : undefined,
  setDefaultValue,
  { deep: true },
);

const integerInputRef = ref<InstanceType<typeof AttributionInputNumber> | null>(
  null,
);
const floatInputRef = ref<InstanceType<typeof AttributionInputNumber> | null>(
  null,
);
const textInputRef = ref<InstanceType<typeof AttributionInputText> | null>(
  null,
);
const enumInputRef = ref<InstanceType<typeof AttributionInputEnum> | null>(
  null,
);

async function validate() {
  // a disabled input shows an existing value that isn't saved, and may no
  // longer match a validation rule changed since
  if (props.disable) return true;

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
    case 'ENUM':
      valueIsValid = Promise.resolve(enumInputRef.value?.validate() ?? false);
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
    case 'ENUM':
      enumInputRef.value?.focus();
      break;
  }
}
</script>

<style scoped lang="scss">
// dims only the controls, unlike Quasar's .disabled, so the hint stays readable
.attribution-input--disabled-controls {
  cursor: not-allowed;

  :deep(.q-field__control),
  :deep(.q-toggle),
  :deep(.q-date),
  :deep(.attribute-form-input-photo),
  :deep(.q-btn) {
    opacity: 0.6;
  }
}

// mimics the bottom row of a dense Quasar field
.attribution-input__hint {
  font-size: 11px;
  line-height: 1;
  padding-top: 8px;
  color: rgba(0, 0, 0, 0.54);

  .body--dark & {
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
