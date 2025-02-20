<template>
  <template v-if="editId">
    <BaseGraphqlError
      v-if="attributionToEditFetchError"
      :error="attributionToEditFetchError"
    />
    <BaseSpinner v-else-if="fetchingAttributionToEdit" size="xl" />
  </template>

  <template v-if="!fetchingAttributionToEdit && !attributionToEditFetchError">
    <q-banner v-if="!formId || !formFields" class="text-white bg-negative">
      {{ t('attributions.add.noFormSelected') }}
      <template #action>
        <q-btn
          flat
          color="white"
          :label="t('attributions.add.selectForm')"
          @click="$emit('select-form')"
        />
      </template>
    </q-banner>
    <q-banner v-else-if="!_author || !_date" class="text-white bg-negative">
      {{ t('attributions.add.missingMetadata') }}
      <template #action>
        <q-btn
          flat
          color="white"
          :label="t('attributions.add.addMetadata')"
          @click="$emit('add-metadata')"
        />
      </template>
    </q-banner>
    <AttributionAddNoEntityError
      v-else-if="!_entity.data"
      :entity-type="_entity.type"
      @click="$emit('select-entity')"
    />
    <q-banner v-else-if="!attributionValues" class="text-white bg-negative">
      {{ t('attributions.add.missingValues') }}
    </q-banner>

    <AttributionAddForm
      v-else
      :entity="_entity"
      :form-id="formId"
      :fields="formFields"
      :date="_date"
      :author="_author"
      :repeat-target="repeatTarget"
      :edit="edit"
      :edit-id="editId"
      :values="attributionValues"
      @saved="goToNext"
      @deleted="goToNext"
      @cancel-edit="goToNext"
    />
  </template>
</template>

<script setup lang="ts">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import AttributionAddNoEntityError from 'src/components/Attribution/Add/AttributionAddNoEntityError.vue';
import { type Slot, computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { graphql } from 'src/graphql';
import {
  attributionFormFragment,
  type AttributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import AttributionAddForm, {
  type AttributionAddFormProps,
} from 'src/components/Attribution/Add/AttributionAddForm.vue';
import {
  plantFragment,
  PlantFragmentWithSegments,
} from 'src/components/Plant/plantFragment';
import {
  PlantGroupFragment,
  plantGroupFragment,
} from 'src/components/PlantGroup/plantGroupFragment';
import {
  CultivarFragment,
  cultivarFragment,
} from 'src/components/Cultivar/cultivarFragment';
import { LotFragment, lotFragment } from 'src/components/Lot/lotFragment';
import { useQuery } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import {
  attributeFragment,
  type AttributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { AttributionInputValue } from '../Input/AttributionInput.vue';

export interface AttributionAddFormDataLoaderProps {
  entity:
    | AttributionAddFormProps['entity']
    | {
        data: null;
        type: AttributionAddFormProps['entity']['type'];
      };
  form: AttributionFormFragment | null;
  date: string;
  author: string;
  repeatTarget: number;
  edit: (id: number) => void;
  editId?: number;
}

const props = defineProps<AttributionAddFormDataLoaderProps>();

const emit = defineEmits<{
  'select-form': [];
  'add-metadata': [];
  'select-entity': [];
  'reset-edit-id': [];
  'reset-me': [];
}>();

defineSlots<{
  'entity-preview': Slot;
}>();

function goToNext(repeatCount: number) {
  emit('reset-edit-id');
  if (repeatCount >= props.repeatTarget || !props.entity.data) {
    // select next entity
    emit('select-entity');
  } else {
    // stay on the same entity
    // but reset the data
    emit('reset-me');
  }
}

const existingAttributionQuery = graphql(
  `
    query Attributions(
      $id: Int!
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = true
      $CultivarWithLot: Boolean = true
      $PlantGroupWithCultivar: Boolean = true
      $PlantWithSegments: Boolean = true
    ) {
      attributions_by_pk(id: $id) {
        id
        author
        date_attributed
        attribution_form {
          ...attributionFormFragment
        }
        attribution_values {
          attribute_id
          integer_value
          float_value
          text_value
          boolean_value
          date_value
          text_note
          photo_note
          exceptional_attribution
          attribute {
            ...attributeFragment
          }
        }
        plant {
          ...plantFragment
        }
        plant_group {
          ...plantGroupFragment
        }
        cultivar {
          ...cultivarFragment
        }
        lot {
          ...lotFragment
        }
      }
    }
  `,
  [
    attributionFormFragment,
    plantFragment,
    plantGroupFragment,
    cultivarFragment,
    lotFragment,
    attributeFragment,
  ],
);

const variables = computed(() => ({ id: props.editId ?? -1 }));
const pause = computed(() => !props.editId);

const {
  fetching: fetchingAttributionToEdit,
  data: attributionToEdit,
  error: attributionToEditFetchError,
} = useQuery({
  query: existingAttributionQuery,
  pause,
  variables,
  context: { additionalTypenames: ['attributions'] },
  requestPolicy: 'network-only',
});

const editData = computed(() =>
  props.editId ? attributionToEdit.value?.attributions_by_pk : null,
);
const editEntity = computed<AttributionAddFormDataLoaderProps['entity']>(() => {
  return editData.value?.plant
    ? {
        data: editData.value.plant as PlantFragmentWithSegments,
        type: AttributableEntities.Plant,
      }
    : editData.value?.plant_group
      ? {
          data: editData.value.plant_group as PlantGroupFragment,
          type: AttributableEntities.PlantGroup,
        }
      : editData.value?.cultivar
        ? {
            data: editData.value.cultivar as CultivarFragment,
            type: AttributableEntities.Cultivar,
          }
        : editData.value?.lot
          ? {
              data: editData.value.lot as LotFragment,
              type: AttributableEntities.Lot,
            }
          : { data: null, type: AttributableEntities.Plant };
});

const _entity = computed(() =>
  props.editId ? editEntity.value : props.entity,
);
const _date = computed(() =>
  props.editId ? editData.value?.date_attributed : props.date,
);
const _author = computed(() =>
  props.editId ? editData.value?.author : props.author,
);
const formId = computed(() =>
  props.editId ? editData.value?.attribution_form.id : props.form?.id,
);
const formFields = computed(() => {
  if (!props.editId) {
    return props.form?.attribution_form_fields.map((field) => ({
      priority: field.priority,
      attribute: field.attribute,
      exceptional: false,
    }));
  }

  const form = editData.value?.attribution_form as
    | AttributionFormFragment
    | undefined;

  // saved exceptional attributes
  const extraAttributes =
    editData.value?.attribution_values
      .filter((value) => value.exceptional_attribution)
      .map((value) => value.attribute as AttributeFragment)
      .map((attribute, index) => ({
        attribute,
        priority: (form?.attribution_form_fields.length || 0) + index,
        exceptional: true,
      })) ?? [];

  return form?.attribution_form_fields
    .map((field) => ({
      priority: field.priority,
      attribute: field.attribute,
      exceptional: false,
    }))
    .concat(extraAttributes);
});

// !!! uses the PRIORITY as the key !!!
// (to allow multiple of the same attribute)
const attributionValues = computed<{
  [key: number]: AttributionInputValue;
} | null>(() => {
  if (editData.value) {
    return editData.value.attribution_values.reduce(
      (acc, value) => {
        const fields = formFields.value?.filter(
          (field) =>
            field.attribute.id === value.attribute_id &&
            field.exceptional === value.exceptional_attribution,
        );

        const idx = Object.values(acc).filter(
          (v) =>
            v.attribute_id === value.attribute_id &&
            v.exceptional_attribution === value.exceptional_attribution,
        ).length;

        // should never happen as formFields depends on editData
        if (!fields?.[idx]) throw new Error('Invalid attribution data');

        const field = fields[idx];
        acc[field.priority] = {
          attribute_id: value.attribute_id,
          boolean_value: value.boolean_value,
          date_value: value.date_value,
          exceptional_attribution: value.exceptional_attribution,
          float_value: value.float_value,
          integer_value: value.integer_value,
          text_note: value.text_note,
          text_value:
            value.attribute.data_type === 'TEXT' ? value.text_value : null,
          photo_note: value.photo_note,
          photo_value:
            value.attribute.data_type === 'PHOTO' ? value.text_value : null,
        };

        return acc;
      },
      {} as { [key: number]: AttributionInputValue },
    );
  } else if (formFields.value) {
    return formFields.value.reduce(
      (acc, field) => {
        acc[field.priority] = {
          attribute_id: field.attribute.id,
          boolean_value: null,
          date_value: null,
          exceptional_attribution: field.exceptional,
          float_value: null,
          integer_value: null,
          text_note: null,
          text_value: null,
          photo_note: null,
          photo_value: null,
        };
        return acc;
      },
      {} as { [key: number]: AttributionInputValue },
    );
  }
  return null;
});

const { t } = useI18n();
</script>
