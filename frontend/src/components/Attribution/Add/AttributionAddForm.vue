<template>
  <AttributionAddEntityPreview :entity="entity" />

  <AttributionAddAlreadyAttributed
    v-if="repeatTarget <= 1 && lastRepeat"
    :date="lastRepeat"
    :entity-type="entity.type"
  />

  <form>
    <AttributionAddFormFieldList
      v-model="attributionValues"
      v-model:input-refs="attributeFormInputRefs"
      :fields="attributeInputs"
    />

    <AttributionAddFormAddInput @add="(a) => extraAttributes.push(a)" />

    <AttributionAddFormSaveButton
      :disable="isSaving || !!insertedAttribution"
      :loading="isSaving"
      :show-progress="isSaving || !!insertedAttribution"
      :progress="savingProgress"
      :transition-duration="SAVE_BTN_TRANSITION_DURATION_MS"
      @save="save"
      @reset-errors="resetErrors"
    >
      <template #error>
        <BaseErrorTooltip
          :message="uploadError || validationError"
          :graphql-error="insertError"
        />
      </template>
      <template v-if="repeatTarget > 1" #counter>
        <AttributionAddRepeatCounter
          :total="repeatTarget"
          :entity-type="entity.type"
          :count="repeatCount"
          style="width: 100%"
          @reset="repeatCount = 0"
        />
      </template>
    </AttributionAddFormSaveButton>
  </form>
</template>

<script setup lang="ts">
import type { AttributionForm } from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import { graphql, VariablesOf } from 'src/graphql';
import { useMutation } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { ref, computed, nextTick, watch } from 'vue';
import {
  useImageUploader,
  UploadProgress,
} from 'src/composables/useImageUploader';
import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { useEntityForm, type InputRef } from 'src/composables/useEntityForm';
import { useRepeatCounter } from './useRepeatCounter';
import AttributionAddFormSaveButton from './AttributionAddFormSaveButton.vue';
import AttributionAddRepeatCounter from 'src/components/Attribution/Add/AttributionAddRepeatCounter.vue';
import BaseErrorTooltip from 'src/components/Base/BaseErrorTooltip.vue';
import AttributionAddFormAddInput from 'src/components/Attribution/Add/AttributionAddFormAddInput.vue';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import AttributionAddAlreadyAttributed from 'src/components/Attribution/Add/AttributionAddAlreadyAttributed.vue';
import { useAttributableEntityName } from 'src/components/Attribution/useAttributableEntityName';
import AttributionAddFormFieldList from 'src/components/Attribution/Add/AttributionAddFormFieldList.vue';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';
import AttributionAddEntityPreview, {
  type AttributionAddFormPreviewProps,
} from 'src/components/Attribution/Add/AttributionAddEntityPreview.vue';

const SAVE_BTN_TRANSITION_DURATION_MS = 400;

export interface AttributionAddFormProps {
  entity: AttributionAddFormPreviewProps['entity'];
  form: AttributionForm;
  date: string;
  author: string;
  repeatTarget: number;
}

type AttributionValue = Omit<
  VariablesOf<typeof mutation>['attributionValues'][0],
  'attribution' | 'attribute'
>;
type AttributionValueWithPhoto = Omit<AttributionValue, 'photo_note'> & {
  photo_value: File | null | undefined;
  photo_note: File | null | undefined;
};

const props = defineProps<AttributionAddFormProps>();

const emit = defineEmits<{
  saved: [repeatCount: number];
}>();

const $q = useQuasar();
const { t } = useI18n();

const formFields = computed(() => props.form.attribution_form_fields);
const extraAttributes = ref<AttributeFragment[]>([]);
const attributeInputs = computed<
  {
    attribute: AttributeFragment;
    priority: number;
    exceptional: boolean;
  }[]
>(() =>
  formFields.value
    .map((formField) => ({
      attribute: formField.attribute as AttributeFragment,
      priority: formField.priority,
      exceptional: false,
    }))
    .concat(
      extraAttributes.value.map((attribute, index) => ({
        attribute,
        priority: formFields.value.length + index,
        exceptional: true,
      })),
    ),
);

// !!! uses the PRIORITY as the key !!!
// (to allow multiple inserts of the same attribute)
const attributionValues = ref<{ [key: number]: AttributionValueWithPhoto }>({});
const attributeFormInputRefs = ref<{ [key: number]: InputRef | null }>({});

function setDefaultValues() {
  for (const { attribute, priority, exceptional } of attributeInputs.value) {
    if (attributionValues.value[priority] === undefined) {
      const { data_type, default_value } = attribute;
      attributionValues.value[priority] = {
        attribute_id: attribute.id,
        exceptional_attribution: exceptional,
        boolean_value: data_type === 'BOOLEAN' ? default_value : null,
        date_value: data_type === 'DATE' ? default_value : null,
        float_value: data_type === 'FLOAT' ? default_value : null,
        integer_value:
          data_type === 'INTEGER' || data_type === 'RATING'
            ? default_value
            : null,
        text_value: data_type === 'TEXT' ? default_value : null,
        photo_value: null, // default_value is not supported for photos
        text_note: null,
        photo_note: null,
      };
    }
  }
}
watch(attributeInputs, setDefaultValues, {
  immediate: true,
  deep: true,
});

const { count: repeatCount, lastChanged: lastRepeat } = useRepeatCounter({
  formId: props.form.id,
  entityId: props.entity.data.id,
  entityType: props.entity.type,
});

const hasValues = computed(() =>
  Object.values(attributionValues.value).some((av) =>
    attributionValueHasValue(av),
  ),
);

const mutation = graphql(`
  mutation InsertAttributions(
    $formId: Int!
    $author: citext!
    $dateAttributed: date!
    $lotId: Int
    $cultivarId: Int
    $plantGroupId: Int
    $plantId: Int
    $attributionValues: [attribution_values_insert_input!]!
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
        attribution_values: { data: $attributionValues }
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
  data: attributionValues,
  initialData: {},
});

const {
  executeMutation: insertAttributions,
  fetching: inserting,
  error: insertError,
  data: insertedAttribution,
} = useMutation(mutation);

async function save() {
  if (!(await validate())) {
    validationError.value = t('attributions.add.invalidInput');
    return;
  }

  if (!hasValues.value) {
    showNoDataNotification();
    return;
  }

  const { photos, attributions } = Object.values(attributionValues.value)
    // filter out attribution_values without a value
    .filter((av) => attributionValueHasValue(av))
    // transform AttributionValueWithPhoto[] into AttributionValue[] and File[]
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
      { photos: [] as File[], attributions: [] as AttributionValue[] },
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
      props.entity.type === AttributableEntities.Lot
        ? props.entity.data.id
        : null,
    cultivarId:
      props.entity.type === AttributableEntities.Cultivar
        ? props.entity.data.id
        : null,
    plantGroupId:
      props.entity.type === AttributableEntities.PlantGroup
        ? props.entity.data.id
        : null,
    plantId:
      props.entity.type === AttributableEntities.Plant
        ? props.entity.data.id
        : null,
    attributionValues: attributions,
  });

  await nextTick();

  if (!insertError.value && insertedAttribution.value) {
    $q.notify({
      type: 'positive',
      message: t('attributions.add.saved'),
      color: 'primary',
      timeout: 3000,
      position: 'top',
    });

    repeatCount.value += 1;

    window.setTimeout(() => {
      emit('saved', repeatCount.value);
    }, SAVE_BTN_TRANSITION_DURATION_MS);
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

const isUploadingPhotos = computed(
  () => photoUploadPercentage.value > 0 && photoUploadPercentage.value < 100,
);

const isSaving = computed(() => inserting.value || isUploadingPhotos.value);

const savingProgress = computed(() => {
  const photoProgress = photoUploadPercentage.value * 0.95;
  const attributionProgress = insertedAttribution.value ? 5 : 0;

  if (!isSaving.value && !insertedAttribution.value) {
    return 0;
  }

  if (insertedAttribution.value) {
    return 100;
  }

  return photoProgress + attributionProgress;
});

function resetErrors() {
  uploadError.value = undefined;
  insertError.value = undefined;
  validationError.value = undefined;
}

const { entity: entityName } = useAttributableEntityName({
  entityType: props.entity.type,
});
function showNoDataNotification() {
  $q.notify({
    type: 'warning',
    message: t('attributions.add.noValues', { entity: entityName.value }),
    color: 'warning',
    timeout: 3000,
    position: 'top',
    actions: [
      {
        label: t('attributions.add.changeEntity', { entity: entityName.value }),
        handler: () => emit('saved', repeatCount.value),
        style: 'width: min-content',
      },
    ],
  });
}
</script>
