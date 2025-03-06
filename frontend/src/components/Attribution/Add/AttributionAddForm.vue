<template>
  <AttributionAddEditNote
    v-if="editId"
    :attribution-id="editId"
    @cancel="$emit('cancelEdit', repeatCount)"
    @deleted="onDeleted"
  />

  <AttributionAddEntityPreview :entity="entity" />

  <AttributionAddLastAttributed
    :entity-id="entity.data.id"
    :form-id="formId"
    :entity-type="entity.type"
  />

  <AttributionAddAlreadyAttributed
    v-if="repeatTarget <= 1 && lastRepeat && !editId"
    :date="lastRepeat"
    :entity-type="entity.type"
  />

  <form>
    <AttributionAddFormFieldList
      v-model="attributionValues"
      v-model:input-refs="attributeFormInputRefs"
      :fields="attributeInputs"
    />

    <AttributionAddFormAddInput @add="addExtraAttribute" />

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
          :graphql-error="saveInsertError || saveEditError"
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
import type { VariablesOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { useMutation } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { ref, computed, nextTick } from 'vue';
import type { UploadProgress } from 'src/composables/useImageUploader';
import { useImageUploader } from 'src/composables/useImageUploader';
import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { useEntityForm, type InputRef } from 'src/composables/useEntityForm';
import { useRepeatCounter } from './useRepeatCounter';
import AttributionAddFormSaveButton from './AttributionAddFormSaveButton.vue';
import AttributionAddRepeatCounter from 'src/components/Attribution/Add/AttributionAddRepeatCounter.vue';
import BaseErrorTooltip from 'src/components/Base/BaseErrorTooltip.vue';
import AttributionAddFormAddInput from 'src/components/Attribution/Add/AttributionAddFormAddInput.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import AttributionAddAlreadyAttributed from 'src/components/Attribution/Add/AttributionAddAlreadyAttributed.vue';
import { useAttributableEntityName } from 'src/components/Attribution/useAttributableEntityName';
import AttributionAddFormFieldList from 'src/components/Attribution/Add/AttributionAddFormFieldList.vue';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';
import AttributionAddEntityPreview, {
  type AttributionAddEntityPreviewProps,
} from 'src/components/Attribution/Add/AttributionAddEntityPreview.vue';
import { type AttributionInputValue } from 'src/components/Attribution/Input/AttributionInput.vue';
import AttributionAddEditNote from 'src/components/Attribution/Add/AttributionAddEditNote.vue';
import AttributionAddLastAttributed from 'src/components/Attribution/Add/AttributionAddLastAttributed.vue';

const SAVE_BTN_TRANSITION_DURATION_MS = 400;

type FormField = {
  attribute: AttributeFragment;
  priority: number;
  exceptional: boolean;
};

export interface AttributionAddFormProps {
  entity: AttributionAddEntityPreviewProps['entity'];
  formId: number;
  fields: FormField[];
  values: { [key: number]: AttributionInputValue };
  date: string;
  author: string;
  repeatTarget: number;
  edit: (id: number) => void;
  editId?: number | undefined;
}

type AttributionValue = Omit<
  VariablesOf<typeof insertMutation>['attributionValues'][0],
  'attribution' | 'attribute' | 'created' | 'attribution_id'
>;

const props = defineProps<AttributionAddFormProps>();

const emit = defineEmits<{
  saved: [repeatCount: number];
  deleted: [repeatCount: number];
  cancelEdit: [repeatCount: number];
}>();

const $q = useQuasar();
const { t } = useI18n();

// !!! uses the PRIORITY as the key !!!
// (to allow multiple inserts of the same attribute)
const attributionValues = ref<{ [key: number]: AttributionInputValue }>(
  props.values,
);
const attributeFormInputRefs = ref<{ [key: number]: InputRef | null }>({});

const extraAttributes = ref<AttributeFragment[]>([]);
const attributeInputs = computed<FormField[]>(() =>
  props.fields.concat(
    extraAttributes.value.map((attribute, index) => ({
      attribute,
      priority: props.fields.length + index,
      exceptional: true,
    })),
  ),
);

function addExtraAttribute(attribute: AttributeFragment) {
  extraAttributes.value.push(attribute);
  attributionValues.value[attributeInputs.value.length] = {
    attribute_id: attribute.id,
    exceptional_attribution: true,
    boolean_value: null,
    date_value: null,
    float_value: null,
    integer_value: null,
    text_value: null,
    photo_value: null,
    text_note: null,
    photo_note: null,
  };
}

const { count: repeatCount, lastChanged: lastRepeat } = useRepeatCounter({
  formId: props.formId,
  entityId: props.entity.data.id,
  entityType: props.entity.type,
});

const hasValues = computed(() =>
  Object.values(attributionValues.value).some((av) =>
    attributionValueHasValue(av),
  ),
);

const uploadError = ref<string | undefined>(undefined);

const validationError = ref<string | undefined>(undefined);
const { validate } = useEntityForm({
  refs: attributeFormInputRefs,
  data: attributionValues,
  initialData: props.values,
});

const insertMutation = graphql(`
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

const {
  fetching: savingInsert,
  error: saveInsertError,
  data: insertedAttribution,
  ...urqlInsert
} = useMutation(insertMutation);

function saveInsert(attributions: AttributionValue[]) {
  return urqlInsert.executeMutation(
    {
      formId: props.formId,
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
    },
    {
      additionalTypenames: [
        'attributions',
        'attribution_values',
        'attributions_view',
      ],
    },
  );
}

const editMutation = graphql(`
  mutation EditAttributions(
    $attributionId: Int!
    $attributionValues: [attribution_values_insert_input!]!
  ) {
    delete_attribution_values(
      where: { attribution_id: { _eq: $attributionId } }
    ) {
      affected_rows
    }
    insert_attribution_values(objects: $attributionValues) {
      affected_rows
    }
  }
`);

const {
  fetching: savingEdit,
  error: saveEditError,
  ...urqlEdit
} = useMutation(editMutation);

function saveEdit(
  attributionId: number,
  attributionValues: AttributionValue[],
) {
  return urqlEdit.executeMutation(
    {
      attributionId,
      attributionValues: attributionValues.map((av) => ({
        ...av,
        attribution_id: attributionId,
      })),
    },
    {
      additionalTypenames: ['attribution_values', 'attributions_view'],
    },
  );
}

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
    // extract files from photo_value and photo_note and replace them with their
    // file name
    .map((av) => {
      const { photo_value, photo_note, ...rest } = av;
      if (photo_value instanceof File) {
        return {
          photo: photo_value,
          attribution: { ...rest, text_value: photo_value.name },
        };
      } else if (typeof photo_value === 'string') {
        return {
          photo: null,
          attribution: { ...rest, text_value: photo_value },
        };
      } else if (photo_note instanceof File) {
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

  if (props.editId) {
    await saveEdit(props.editId, attributions);
  } else {
    await saveInsert(attributions);
    repeatCount.value += 1;
  }

  await nextTick();

  if (saveEditError.value || saveInsertError.value) {
    return;
  }

  const attributionId =
    props.editId || insertedAttribution.value?.insert_attributions_one?.id;

  if (!attributionId) {
    // e.g. on network error
    return;
  }

  $q.notify({
    type: 'positive',
    message: t('attributions.add.saved'),
    color: 'positive',
    timeout: 5000,
    position: 'top',
    actions: [
      {
        label: t('attributions.add.edit'),
        color: 'white',
        handler: () => props.edit(attributionId),
      },
    ],
  });

  window.setTimeout(() => {
    emit('saved', repeatCount.value);
  }, SAVE_BTN_TRANSITION_DURATION_MS);
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

const isSaving = computed(
  () => savingEdit.value || savingInsert.value || isUploadingPhotos.value,
);

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
  saveInsertError.value = undefined;
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
    timeout: 5000,
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

async function onDeleted() {
  if (repeatCount.value > 0) repeatCount.value -= 1;
  await nextTick();
  emit('deleted', repeatCount.value);
}
</script>
