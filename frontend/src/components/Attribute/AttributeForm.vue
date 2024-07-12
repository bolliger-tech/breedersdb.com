<template>
  <form>
    <ul class="attribute-form__list">
      <li
        v-for="formField in form.attribution_form_fields"
        :key="formField.priority"
      >
        <!-- <AttributeFormInput
          v-model="attributeValues[formField.priority]"
          :attribute="formField.attribute"
          :exceptional="false"
        /> -->
      </li>
    </ul>
    <!-- TODO: add exceptional attributions -->
    <!-- TODO: save -->
  </form>
</template>

<script setup lang="ts">
import type { AttributionForm } from 'src/components/Attribute/AttributeSteps.vue';
// import { useI18n } from 'src/composables/useI18n';
import { graphql, VariablesOf } from 'src/graphql';
// import { useMutation } from '@urql/vue';
import { AttributableEntities } from 'src/components/Attribute/attributableEntities';
// import { ref } from 'vue';
// import AttributeFormInput from 'src/components/Attribute/AttributeFormInput.vue';

export interface AttributeFormProps {
  entityId: number;
  entityType: AttributableEntities;
  form: AttributionForm;
  date: string;
  author: string;
}

export type AttributeInsertData = VariablesOf<
  typeof mutation
>['attributeValues'][0];

// const props = defineProps<AttributeFormProps>();
defineProps<AttributeFormProps>();

// const { t } = useI18n();

// !!! uses the PRIORITY as the key !!!
// (to allow multiple inserts of the same attribute)
// const attributeValues = ref<{ [key: number]: AttributeInsertData }>({});

const mutation = graphql(`
  mutation InsertAttributions(
    $formId: Int!
    $author: String!
    $dateAttributed: String!
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
      affected_rows
    }
  }
`);

// TODO: handle photos
// const {
//   executeMutation: insertAttributions,
//   fetching: saving,
//   error,
// } = useMutation(mutation);

// async function save() {
//   const values = Object.values(attributeValues.value).filter(
//     (av) =>
//       // do not store attribution_values without a value
//       av.integer_value !== null ||
//       av.float_value !== null ||
//       av.text_value !== null ||
//       av.boolean_value !== null ||
//       av.date_value !== null,
//   );

//   if (values.length === 0) {
//     // do not store attributions without any values
//     return;
//   }

//   await insertAttributions({
//     formId: props.form.id,
//     author: props.author,
//     dateAttributed: props.date,
//     lotId:
//       props.entityType === AttributableEntities.Lot ? props.entityId : null,
//     cultivarId:
//       props.entityType === AttributableEntities.Cultivar
//         ? props.entityId
//         : null,
//     plantGroupId:
//       props.entityType === AttributableEntities.PlantGroup
//         ? props.entityId
//         : null,
//     plantId:
//       props.entityType === AttributableEntities.Plant ? props.entityId : null,
//     attributeValues: values,
//   });
// }
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
