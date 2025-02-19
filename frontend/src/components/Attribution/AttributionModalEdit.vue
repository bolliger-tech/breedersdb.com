<template>
  <EntityModalContent
    :loading="savingEdit || isUploadingPhotos"
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
      <div v-if="loadingPhotos" class="row justify-center">
        <q-spinner color="primary" size="3em" />
      </div>
      <BaseMessage
        v-else-if="photoFetchError"
        type="error"
        icon-size="3em"
        message-color="negative"
        :message="photoFetchError"
        class="bg-black rounded-borders q-pa-sm"
        style="word-break: break-all"
      />
      <AttributionInput
        v-else
        ref="formRef"
        v-model="model"
        :attribute="attribution.attribute"
        :exceptional="attribution.exceptional_attribution"
        :has-same-again="false"
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
import { AttributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
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
import { computed, nextTick, ref, watch } from 'vue';
import AttributionInput from 'src/components/Attribution/Input/AttributionInput.vue';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { useMutation } from '@urql/vue';
import type { AttributionValueWithPhoto } from 'src/components/Attribution/Add/AttributionAddForm.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { captureException } from '@sentry/browser';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';
import {
  UploadProgress,
  useImageUploader,
} from 'src/composables/useImageUploader';
import { getImageUrlRelative } from 'src/utils/imageUtils';

export type AttributionEditInput = Pick<
  AttributionsViewFragment,
  | 'integer_value'
  | 'float_value'
  | 'text_value'
  | 'boolean_value'
  | 'date_value'
  | 'text_note'
  | 'photo_note'
>;

export interface AttributionModalEditProps {
  attribution: AttributionsViewFragment & { attribute: AttributeFragment };
}

const props = defineProps<AttributionModalEditProps>();

const model = ref<AttributionValueWithPhoto>({
  integer_value: props.attribution.integer_value,
  float_value: props.attribution.float_value,
  text_value: props.attribution.text_value,
  boolean_value: props.attribution.boolean_value,
  date_value: props.attribution.date_value,
  text_note: props.attribution.text_note,
  photo_value: null,
  photo_note: null,
});
const editedData = ref<AttributionValueWithPhoto | null>(null);

const hasPhoto =
  props.attribution.photo_note || props.attribution.data_type === 'PHOTO';

const loadingPhotos = ref(hasPhoto);
const photoFetchError = ref<string | null>(null);

if (hasPhoto) {
  addPhotosToModel();
}

async function addPhotosToModel() {
  if (props.attribution.photo_note) {
    model.value.photo_note = await loadPhoto(props.attribution.photo_note);
  }
  if (props.attribution.data_type === 'PHOTO' && props.attribution.text_value) {
    model.value.photo_value = await loadPhoto(props.attribution.text_value);
  }
  loadingPhotos.value = false;
}

async function loadPhoto(fileName: string) {
  return await fetch(
    getImageUrlRelative({
      serverFileName: fileName,
      desiredFileName: fileName,
    }),
  )
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch photo: ${res.status} ${res.statusText}. URL: ${res.url}`,
        );
      }
      return new File([await res.blob()], fileName);
    })
    .catch((e) => {
      if (e instanceof Error) {
        captureException(e);
        photoFetchError.value = e.message;
      } else {
        photoFetchError.value = 'Unknown error';
      }
      return null;
    });
}

const editMutation = graphql(`
  mutation UpdateAttributionValue(
    $id: Int!
    $entity: attribution_values_set_input!
  ) {
    update_attribution_values_by_pk(pk_columns: { id: $id }, _set: $entity) {
      id
    }
    refresh_attributions_view(
      where: { view_name: { _eq: "attributions_view" } }
      limit: 1
    ) {
      id
    }
  }
`);

const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveError,
} = useMutation(editMutation);

const { cancel } = useCancel({ path: '/attributions' });
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const closeModal = useInjectOrThrow(closeModalSymbol);

const uploadError = ref<string | undefined>(undefined);
const validationError = ref<string | null>(null);

watch(
  model,
  async () => {
    await nextTick();
    if (!loadingPhotos.value) {
      editedData.value = model.value;
      makeModalPersistent(true);
    }
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

  if (!attributionValueHasValue(model.value)) {
    validationError.value = t('attributions.noValueOnEdit');
    return;
  }
  try {
    await saveEdit();
  } catch (error) {
    return;
  }

  await nextTick();

  if (!saveError.value) {
    makeModalPersistent(false);
    closeModal();
  }
}

const photoUploadPercentage = ref<number>(0);
const { upload } = useImageUploader((progress: UploadProgress) => {
  photoUploadPercentage.value = progress.percentComplete;
});

const isUploadingPhotos = computed(
  () => photoUploadPercentage.value > 0 && photoUploadPercentage.value < 100,
);

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  const {
    photo_value,
    photo_note,
    integer_value,
    float_value,
    text_value,
    boolean_value,
    date_value,
    text_note,
  } = editedData.value;
  const editedAttributionValue = {
    photo_note: null as string | null | undefined,
    integer_value,
    float_value,
    text_value,
    boolean_value,
    date_value,
    text_note,
  };
  const photo = photo_value || photo_note;

  // upload photo if it was changed
  if (photo) {
    const editedPhotoName = photo.name;
    const initialPhotoName =
      props.attribution.photo_note || props.attribution.text_value;
    if (editedPhotoName !== initialPhotoName) {
      const hash = editedPhotoName.split('.').slice(0, -1).join('.');
      try {
        await upload(photo, hash, '/api/assets/upload');
      } catch (error) {
        if (error instanceof Error) {
          uploadError.value = error.message;
        }
        throw error; // do not continue with the mutation
      }
    }
    if (photo_value) {
      editedAttributionValue.text_value = editedPhotoName;
    }
    if (photo_note) {
      editedAttributionValue.photo_note = editedPhotoName;
    }
  }

  return executeEditMutation(
    {
      id: props.attribution.id,
      entity: editedAttributionValue,
    },
    { additionalTypenames: ['attributions_view'] },
  );
}

function resetErrors() {
  uploadError.value = undefined;
  saveError.value = undefined;
  validationError.value = null;
}

const { t } = useI18n();
</script>
src/components/Attribution/attributionValueHasValue
