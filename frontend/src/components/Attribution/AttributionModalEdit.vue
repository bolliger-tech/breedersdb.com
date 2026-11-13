<template>
  <EntityModalContent
    :loading="savingEdit || isUploading"
    :save-error="saveError"
    :validation-error="validationError || uploadError"
    sprite-icon="star"
    :title="t('base.edit')"
    :subtitle="t('attributions.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <AttributionInput
        ref="formRef"
        v-model="model"
        :attribute="attribution.attribute"
        :exceptional="attribution.exceptional_attribution"
        :required="true"
        :entity-name="getAttributedEntityName(attribution)"
        :date-attributed="attribution.date_attributed"
        :attribution-id="attribution.id"
      />
    </template>

    <template #action-left>
      <AttributionButtonDelete
        :attribution-id="attribution.attribution_id"
        :attribution-value-id="attribution.id"
        @deleted="
          () => $router.push({ path: '/attributions', query: $route.query })
        "
      />
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { graphql } from 'src/graphql';
import AttributionButtonDelete from 'src/components/Attribution/AttributionButtonDelete.vue';
import { useI18n } from 'src/composables/useI18n';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';
import { nextTick, ref, watch } from 'vue';
import AttributionInput, {
  type AttributionInputValue,
} from 'src/components/Attribution/Input/AttributionInput.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { useMutation } from '@urql/vue';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';
import { cachedAttributionToInputValue } from 'src/components/Attribution/cachedAttributionToInputValue';
import { useAttributionFileUpload } from 'src/components/Attribution/useAttributionFileUpload';
import { getAttributedEntityName } from 'src/utils/attributeUtils';

export type AttributionEditInput = Pick<
  CachedAttributionsFragment,
  | 'integer_value'
  | 'float_value'
  | 'text_value'
  | 'boolean_value'
  | 'date_value'
  | 'text_note'
  | 'photo_note'
>;

export interface AttributionModalEditProps {
  attribution: CachedAttributionsFragment & { attribute: AttributeFragment };
}

const props = defineProps<AttributionModalEditProps>();

const model = ref<AttributionInputValue>({
  ...cachedAttributionToInputValue(
    props.attribution,
    props.attribution.attribute.enum_options,
  ),
  text_note: props.attribution.text_note,
  photo_note: props.attribution.photo_note,
});
const editedData = ref<AttributionInputValue>(undefined);

const editMutation = graphql(`
  mutation UpdateAttributionValue(
    $id: Int!
    $entity: attribution_values_set_input!
  ) {
    update_attribution_values_by_pk(pk_columns: { id: $id }, _set: $entity) {
      id
    }
  }
`);

const {
  fetching: savingEdit,
  error: saveError,
  ...urqlEdit
} = useMutation(editMutation);

const { cancel } = useCancel({ path: '/attributions' });
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const closeModal = useInjectOrThrow(closeModalSymbol);

const uploadError = ref<string | undefined>(undefined);
const validationError = ref<string | null>(null);

watch(
  model,
  () => {
    editedData.value = model.value;
    makeModalPersistent(true);
  },
  { deep: true },
);

const formRef = ref<InstanceType<typeof AttributionInput> | null>(null);

async function save() {
  const isValid = await formRef.value?.validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    formRef.value?.focus();
    return;
  }

  if (!model.value || !attributionValueHasValue(model.value)) {
    validationError.value = t('attributions.noValueOnEdit');
    return;
  }
  try {
    await saveEdit();
  } catch {
    return;
  }

  await nextTick();

  if (!saveError.value) {
    makeModalPersistent(false);
    closeModal();
  }
}

const { uploadFiles, isUploading } = useAttributionFileUpload();

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  const {
    file_value,
    photo_note,
    integer_value,
    float_value,
    text_value,
    boolean_value,
    date_value,
    text_note,
    attribute_enum_option_id,
  } = editedData.value;
  const isEnum = props.attribution.data_type === 'ENUM';

  let editedAttributionValue;
  try {
    editedAttributionValue = (
      await uploadFiles([
        {
          value: {
            file_value,
            photo_note,
            integer_value: integer_value ?? null,
            float_value: float_value ?? null,
            text_value: isEnum ? null : (text_value ?? null),
            boolean_value: boolean_value ?? null,
            date_value: date_value ?? null,
            attribute_enum_option_id: attribute_enum_option_id ?? null,
            text_note: text_note ?? null,
          },
          dataType: props.attribution.data_type,
        },
      ])
    )[0]!;
  } catch (error) {
    if (error instanceof Error) {
      uploadError.value = error.message;
    }
    throw error; // do not continue with the mutation
  }

  return urqlEdit.executeMutation(
    {
      id: props.attribution.id,
      entity: editedAttributionValue,
    },
    { additionalTypenames: ['cached_attributions'] },
  );
}

function resetErrors() {
  uploadError.value = undefined;
  saveError.value = undefined;
  validationError.value = null;
}

const { t } = useI18n();
</script>
