<template>
  <ul
    class="attribute-form-field-list"
    :class="{ 'attribute-form-field-list--no-bottom-border': noBottomBorder }"
  >
    <li v-for="field in fields" :key="field.priority">
      <AttributionAddFormInput
        :ref="
          (el: InputRef) => {
            if (inputRefs) return (inputRefs[field.priority] = el);
          }
        "
        v-model="modelValue[field.priority]"
        :attribute="field.attribute"
        :exceptional="field.exceptional"
        :has-same-again="
          fields.some(
            (af) =>
              af.attribute.id === field.attribute.id &&
              af.priority !== field.priority,
          )
        "
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import AttributionAddFormInput from 'src/components/Attribution/Add/AttributionAddFormInput.vue';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { type InputRef } from 'src/composables/useEntityForm';
import { type AttributionValueWithPhoto } from 'src/components/Attribution/Add/AttributionAddForm.vue';

export interface AttributionAddFormFieldListProps {
  fields: {
    priority: number;
    attribute: AttributeFragment;
    exceptional: boolean;
  }[];
  noBottomBorder?: boolean;
}

defineProps<AttributionAddFormFieldListProps>();

const inputRefs = defineModel<{ [key: number]: InputRef | null }>('inputRefs');
const modelValue = defineModel<{ [key: number]: AttributionValueWithPhoto }>({
  required: true,
});
</script>

<style scoped lang="scss">
.attribute-form-field-list {
  list-style-type: none;
  padding: 0;

  li {
    border-bottom: 1px solid $grey-4;

    .body--dark & {
      border-color: $grey-8;
    }
  }

  &--no-bottom-border {
    li:last-child {
      border-bottom: none;
    }
  }
}
</style>
