<template>
  <AttributionAddEditNote
    v-if="editId"
    :attribution-id="editId"
    @cancel="$emit('cancelEdit', repeatCount)"
    @deleted="onDeleted"
  />

  <AttributionAddAboutEntity :entity="entity" :form-id="formId" />

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
      :collisions="collisions"
      :locked-priorities="lockedPriorities"
      :repeated-unique-priorities="repeatedUniquePriorities"
      :hide-unfilled-unique-hints="hideUnfilledUniqueHints"
      :entity-name="attributedEntityName"
      :date-attributed="date"
      @unlock="unlock"
      @lock="lock"
    />

    <AttributionAddFormAddInput @add="addExtraAttribute" />

    <AttributionAddFormSaveButton
      :disable="
        isSaving || !!insertedAttribution || fetchingExistingUniqueValues
      "
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
          :graphql-error="
            saveInsertError || saveEditError || uniqueValuesCheckError
          "
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

  <AttributionAddForceSaveDialog
    v-model="showForceSaveDialog"
    :fields="requiredFieldsWithoutValue"
    @cancel="showForceSaveDialog = false"
    @confirm="
      () => {
        save(true);
        showForceSaveDialog = false;
      }
    "
  />
</template>

<script setup lang="ts">
import type { VariablesOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { useMutation, useQuery, type CombinedError } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { ref, computed, nextTick } from 'vue';
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
import { useAttributionFileUpload } from 'src/components/Attribution/useAttributionFileUpload';
import { type AttributionInputValue } from 'src/components/Attribution/Input/AttributionInput.vue';
import AttributionAddEditNote from 'src/components/Attribution/Add/AttributionAddEditNote.vue';
import AttributionAddAboutEntity from 'src/components/Attribution/Add/About/AttributionAddAboutEntity.vue';
import type { UndefinedToNull } from 'src/utils/typescriptUtils';
import type { EntityPreviewEntity } from './About/attributionAddAboutEntityTypes';
import AttributionAddForceSaveDialog from 'src/components/Attribution/Add/AttributionAddForceSaveDialog.vue';
import {
  cachedAttributionsFragment,
  type CachedAttributionsFragment,
} from 'src/components/Attribution/cachedAttributionsFragment';
import { findCollisions, type Collision } from './findCollisions';
import { findRepeatedUniqueValues } from './findRepeatedUniqueValues';

const SAVE_BTN_TRANSITION_DURATION_MS = 400;

export type FormField = {
  attribute: AttributeFragment;
  priority: number;
  exceptional: boolean;
  required: boolean;
};

export interface AttributionAddFormProps {
  entity: EntityPreviewEntity;
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
      required: false,
    })),
  ),
);

function addExtraAttribute(attribute: AttributeFragment) {
  const priority = attributeInputs.value.length;
  extraAttributes.value.push(attribute);
  attributionValues.value[priority] = {
    attribute_id: attribute.id,
    exceptional_attribution: true,
    boolean_value: null,
    date_value: null,
    float_value: null,
    integer_value: null,
    text_value: null,
    file_value: null,
    text_note: null,
    photo_note: null,
  };
}

const attributedEntityName = computed(() =>
  props.entity.type === AttributableEntities.Plant
    ? props.entity.data.label_id
    : props.entity.data.display_name,
);

const uniqueAttributeIds = computed<number[]>((previous) => {
  const ids = attributeInputs.value
    .filter((field) => field.attribute.cardinality !== 'REPEATABLE')
    .map((field) => field.attribute.id);
  // keep the previous array if unchanged, so the query below doesn't refetch
  return previous?.join() === ids.join() ? previous : ids;
});

const existingUniqueValuesQuery = graphql(
  `
    query ExistingUniqueAttributionValues(
      $where: cached_attributions_bool_exp!
      $CachedAttributionsWithEntites: Boolean = false
    ) {
      cached_attributions(where: $where) {
        ...cachedAttributionsFragment
      }
    }
  `,
  [cachedAttributionsFragment],
);

const entityIdColumn = computed(
  () =>
    ({
      [AttributableEntities.Plant]: 'plant_id',
      [AttributableEntities.PlantGroup]: 'plant_group_id',
      [AttributableEntities.Cultivar]: 'cultivar_id',
      [AttributableEntities.Lot]: 'lot_id',
    })[props.entity.type],
);

// network-only and saving waits for it: on stale or missing data, a replacing
// value would silently delete the existing one without being unlocked
const {
  data: existingUniqueValues,
  fetching: fetchingExistingUniqueValues,
  error: existingUniqueValuesError,
  ...urqlExistingUniqueValues
} = useQuery({
  query: existingUniqueValuesQuery,
  variables: computed(() => ({
    where: {
      attribute_id: { _in: uniqueAttributeIds.value },
      [entityIdColumn.value]: { _eq: props.entity.data.id },
    },
  })),
  pause: computed(() => uniqueAttributeIds.value.length === 0),
  context: { additionalTypenames: ['cached_attributions'] },
  requestPolicy: 'network-only',
});
const uniqueValuesCheckError = ref<CombinedError | undefined>(undefined);

// frozen once inserted: the refetch after saving finds the just saved values,
// which would lock their inputs during the save transition
const collisions = computed<Map<number, Collision<CachedAttributionsFragment>>>(
  (previous) =>
    insertedAttribution.value && previous
      ? previous
      : findCollisions({
          attributes: attributeInputs.value.map((field) => field.attribute),
          existingValues: (existingUniqueValues.value?.cached_attributions ??
            []) as CachedAttributionsFragment[],
          editedAttributionId: props.editId,
        }),
);

// whether a value is unfilled is unknown until the existing values are loaded.
// when editing, the edited values aren't collisions, but are filled.
// frozen once inserted, like the collisions.
const hideUnfilledUniqueHints = computed<boolean>((previous) =>
  insertedAttribution.value && previous !== undefined
    ? previous
    : !!props.editId ||
      fetchingExistingUniqueValues.value ||
      !!existingUniqueValuesError.value ||
      !existingUniqueValues.value,
);

// replacing values must be unlocked explicitly
const unlockedPriorities = ref(new Set<number>());

// values of locked attributes are not saved: the database would reject
// blocked ones, and replacing ones need to be unlocked first
const lockedPriorities = computed(
  () =>
    new Set(
      attributeInputs.value
        .filter((field) => {
          const behavior = collisions.value.get(field.attribute.id)?.behavior;
          return (
            behavior === 'BLOCK' ||
            (behavior === 'REPLACE' &&
              !unlockedPriorities.value.has(field.priority))
          );
        })
        .map((field) => field.priority),
    ),
);

async function unlock(priority: number) {
  unlockedPriorities.value.add(priority);
  await nextTick();
  attributeFormInputRefs.value[priority]?.focus();
}

function lock(priority: number) {
  unlockedPriorities.value.delete(priority);
  attributionValues.value[priority] = undefined;
}

// the database accepts only one value of a unique attribute per attribution
const repeatedUniquePriorities = computed(() =>
  findRepeatedUniqueValues({
    fields: attributeInputs.value.filter(
      (field) => !lockedPriorities.value.has(field.priority),
    ),
    values: attributionValues.value,
  }),
);

const submittableValues = computed(() =>
  Object.entries(attributionValues.value)
    .filter(([priority]) => !lockedPriorities.value.has(Number(priority)))
    .map(([, av]) => av),
);

const { count: repeatCount, lastChanged: lastRepeat } = useRepeatCounter({
  formId: props.formId,
  entityId: props.entity.data.id,
  entityType: props.entity.type,
});

const hasValues = computed(() =>
  submittableValues.value.some((av) => av && attributionValueHasValue(av)),
);

const requiredFieldsWithoutValue = computed(() =>
  attributeInputs.value
    .filter((field) => field.required)
    .filter((field) => !lockedPriorities.value.has(field.priority))
    .filter((field) => {
      const value = attributionValues.value[field.priority];
      return !value || !attributionValueHasValue(value);
    }),
);

const showForceSaveDialog = ref(false);

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
        'cached_attributions',
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
      additionalTypenames: ['attribution_values', 'cached_attributions'],
    },
  );
}

async function save(ignoreRequired = false) {
  if (existingUniqueValuesError.value) {
    uniqueValuesCheckError.value = existingUniqueValuesError.value;
    // retry, so a transient network error doesn't block saving for good
    void urqlExistingUniqueValues.executeQuery();
    return;
  }

  if (!(await validate())) {
    validationError.value = t('attributions.add.invalidInput');
    return;
  }

  if (repeatedUniquePriorities.value.size) {
    validationError.value = t('attributions.add.uniqueRepeated');
    return;
  }

  if (!hasValues.value) {
    showNoDataNotification();
    return;
  }

  if (!ignoreRequired && requiredFieldsWithoutValue.value.length) {
    showForceSaveDialog.value = true;
    return;
  }

  const values = submittableValues.value
    // filter out attribution_values without a value
    .filter((av) => av && attributionValueHasValue(av))
    // replace undefined values with null
    .map((av) => {
      if (!av) {
        // this should never happen as we already filtered out undefined values
        throw new Error('Unexpected undefined value');
      }
      return Object.entries(av).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value === undefined ? null : value,
        }),
        {} as UndefinedToNull<NonNullable<AttributionInputValue>>,
      );
    })
    .map((value) => ({
      value,
      dataType: attributeInputs.value.find(
        (field) => field.attribute.id === value.attribute_id,
      )!.attribute.data_type,
    }));

  let attributions: AttributionValue[];
  try {
    attributions = await uploadFiles(values);
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

const {
  uploadFiles,
  percentComplete: uploadPercentage,
  isUploading,
} = useAttributionFileUpload();

const isSaving = computed(
  () => savingEdit.value || savingInsert.value || isUploading.value,
);

const savingProgress = computed(() => {
  const uploadProgress = uploadPercentage.value * 0.95;
  const attributionProgress = insertedAttribution.value ? 5 : 0;

  if (!isSaving.value && !insertedAttribution.value) {
    return 0;
  }

  if (insertedAttribution.value) {
    return 100;
  }

  return uploadProgress + attributionProgress;
});

function resetErrors() {
  uploadError.value = undefined;
  saveInsertError.value = undefined;
  validationError.value = undefined;
  uniqueValuesCheckError.value = undefined;
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
