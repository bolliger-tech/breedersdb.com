<template>
  <form>
    <ul class="attribute-form__list">
      <li
        v-for="formField in form.attribution_form_fields"
        :key="formField.priority"
      >
        <AttributeFormInput
          :ref="
            (el: InputRef) => (attributeFormInputRefs[formField.priority] = el)
          "
          v-model="attributeValues[formField.priority]"
          :attribute="formField.attribute"
          :exceptional="false"
        />
      </li>
    </ul>
    <!-- TODO: add exceptional attributions -->
    <q-page-sticky :offset="[18, 18]" position="bottom-right">
      <BaseErrorTooltip
        :message="uploadError || validationError"
        :graph-q-l-error="insertError"
      />
      <div
        class="row align-center shadow-3"
        :class="{
          'bg-grey-10': !$q.dark.isActive,
          'bg-grey-9': $q.dark.isActive,
        }"
        style="border-radius: 2rem"
      >
        <AttributeRepeatCounter
          v-if="repeatTarget > 1"
          class="q-mx-md"
          :total="repeatTarget"
          :entity-type="entityType"
          :count="repeatCount"
          @reset="repeatCount = 0"
        />
        <q-btn
          color="primary"
          icon="save"
          fab
          unelevated
          :disable="!hasValues || isSaving"
          :loading="isSaving"
          :percentage="photoUploadPercentage * 0.95"
          :style="
            repeatTarget > 1 ? 'border: 1px solid white; margin: 2px' : ''
          "
          @click="save"
          @mouseleave="resetErrors"
          @focusout="resetErrors"
        />
      </div>
    </q-page-sticky>
  </form>
</template>

<script setup lang="ts">
import type { AttributionForm } from 'src/components/Attribute/AttributeSteps.vue';
import { graphql, VariablesOf } from 'src/graphql';
import { useMutation } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribute/attributableEntities';
import { ref, computed, nextTick } from 'vue';
import AttributeFormInput from 'src/components/Attribute/AttributeFormInput.vue';
import {
  useImageUploader,
  UploadProgress,
} from 'src/composables/useImageUploader';
import BaseErrorTooltip from 'src/components/Base/BaseErrorTooltip.vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { useEntityForm, type InputRef } from 'src/composables/useEntityForm';
import AttributeRepeatCounter from 'src/components/Attribute/AttributeRepeatCounter.vue';
import { useRepeatCounter } from './useRepeatCounter';

export interface AttributeFormProps {
  entityId: number;
  entityType: AttributableEntities;
  form: AttributionForm;
  date: string;
  author: string;
  repeatTarget: number;
}

type AttributeValue = Omit<
  VariablesOf<typeof mutation>['attributeValues'][0],
  'attribution' | 'attribute'
>;
export type AttributeValueWithPhoto = Omit<AttributeValue, 'photo_note'> & {
  photo_value: File | null | undefined;
  photo_note: File | null | undefined;
};

const props = defineProps<AttributeFormProps>();

const emit = defineEmits<{
  saved: [repeatCount: number];
}>();

const $q = useQuasar();
const { t } = useI18n();

// !!! uses the PRIORITY as the key !!!
// (to allow multiple inserts of the same attribute)
const attributeValues = ref<{ [key: number]: AttributeValueWithPhoto }>({});
const attributeFormInputRefs = ref<{ [key: number]: InputRef | null }>({});

const repeatCount = useRepeatCounter({
  formId: props.form.id,
  entityId: props.entityId,
  entityType: props.entityType,
});

const hasValues = computed(() =>
  Object.values(attributeValues.value).some(
    (av) =>
      av.integer_value !== null ||
      av.float_value !== null ||
      av.text_value !== null ||
      av.boolean_value !== null ||
      av.date_value !== null ||
      av.photo_value !== null,
  ),
);

const mutation = graphql(`
  mutation InsertAttributions(
    $formId: Int!
    $author: String!
    $dateAttributed: date!
    $lotId: Int
    $cultivarId: Int
    $plantGroupId: Int
    $plantId: Int
    $attributeValues: [attribute_values_insert_input!]!
  ) {
    insert_attributions_one(
      object: {
        attribution_form_id: $formId
        author: $author
        date_attributed: $dateAttributed
        lot_id: $lotId
        cultivar_id: $cultivarId
        plant_group_id: $plantGroupId
        plant_id: $plantId
        attribute_values: { data: $attributeValues }
      }
    ) {
      id
    }
  }
`);

const uploadError = ref<string | undefined>(undefined);

const validationError = ref<string | undefined>(undefined);
const { validate } = useEntityForm({
  refs: attributeFormInputRefs,
  data: attributeValues,
  initialData: {},
});

const {
  executeMutation: insertAttributions,
  fetching: inserting,
  error: insertError,
} = useMutation(mutation);

async function save() {
  if (!(await validate())) {
    validationError.value = t('attribute.invalidInput');
    return;
  }

  const { photos, attributions } = Object.values(attributeValues.value)
    // filter out attribution_values without a value
    .filter(
      (av) =>
        av.integer_value !== null ||
        av.float_value !== null ||
        av.text_value !== null ||
        av.boolean_value !== null ||
        av.date_value !== null ||
        av.photo_value !== null,
    )
    // transform AttributeValueWithPhoto[] into AttributeValue[] and File[]
    .map((av) => {
      const { photo_value, photo_note, ...rest } = av;
      if (photo_value) {
        return {
          photo: photo_value,
          attribution: { ...rest, text_value: photo_value.name },
        };
      } else if (photo_note) {
        return {
          photo: photo_note,
          attribution: { ...rest, photo_note: photo_note.name },
        };
      } else {
        return { photo: null, attribution: rest };
      }
    })
    .reduce(
      (acc, { photo, attribution }) => {
        acc.attributions.push(attribution);
        if (photo) {
          acc.photos.push(photo);
        }
        return acc;
      },
      { photos: [] as File[], attributions: [] as AttributeValue[] },
    );

  try {
    await uploadPhotos(photos);
  } catch (error) {
    if (error instanceof Error) {
      uploadError.value = error.message;
      return; // do not continue with the insert
    } else {
      // this should never happen
      throw error;
    }
  }

  await insertAttributions({
    formId: props.form.id,
    author: props.author,
    dateAttributed: props.date,
    lotId:
      props.entityType === AttributableEntities.Lot ? props.entityId : null,
    cultivarId:
      props.entityType === AttributableEntities.Cultivar
        ? props.entityId
        : null,
    plantGroupId:
      props.entityType === AttributableEntities.PlantGroup
        ? props.entityId
        : null,
    plantId:
      props.entityType === AttributableEntities.Plant ? props.entityId : null,
    attributeValues: attributions,
  });

  await nextTick();

  if (!insertError.value) {
    $q.notify({
      type: 'positive',
      message: t('attribute.saved'),
      color: 'primary',
      timeout: 3000,
      position: 'top',
    });

    repeatCount.value += 1;
    emit('saved', repeatCount.value);
  }
}

const photoUploadPercentage = ref(0);
const uploadBytes = ref({
  total: 0,
  completed: 0,
});

function handlePhotoUploadProgress(progress: UploadProgress) {
  photoUploadPercentage.value =
    (100 * (uploadBytes.value.completed + progress.bytesUploaded)) /
    uploadBytes.value.total;
}

const { upload } = useImageUploader(handlePhotoUploadProgress);

async function uploadPhotos(files: File[]) {
  if (files.some((f) => f.size === 0)) {
    // this should never happen as the file was already checked before resizing
    throw new Error('Cannot upload empty files');
  }

  photoUploadPercentage.value = 0;
  uploadBytes.value = {
    total: files.reduce((acc, file) => acc + file.size, 0),
    completed: 0,
  };

  if (files.length === 0) {
    return;
  }

  for (const file of files) {
    const hash = file.name.split('.').slice(0, -1).join('.');
    // may throw, must be caught by the caller
    await upload(file, hash, '/api/assets/upload');
    uploadBytes.value.completed += file.size;
  }
}

const isSaving = computed(
  () =>
    inserting.value ||
    (photoUploadPercentage.value > 0 && photoUploadPercentage.value < 100),
);

function resetErrors() {
  uploadError.value = undefined;
  insertError.value = undefined;
  validationError.value = undefined;
}
</script>

<style scoped lang="scss">
.attribute-form__list {
  list-style-type: none;
  padding: 0;

  li {
    border-bottom: 1px solid $grey-4;

    .body--dark & {
      border-color: $grey-8;
    }
  }
}
</style>
