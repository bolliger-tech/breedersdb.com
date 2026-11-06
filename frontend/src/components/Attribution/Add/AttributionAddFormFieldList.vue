<template>
  <ul
    class="attribute-form-field-list"
    :class="{ 'attribute-form-field-list--no-bottom-border': noBottomBorder }"
  >
    <li v-for="field in fields" :key="field.priority">
      <AttributionInput
        :ref="
          (el: InputRef) => {
            if (inputRefs) return (inputRefs[field.priority] = el);
          }
        "
        v-model="modelValue[field.priority]"
        :attribute="field.attribute"
        :exceptional="field.exceptional"
        :required="field.required"
        :disable="collisions?.get(field.attribute.id)?.behavior === 'BLOCK'"
      >
        <template
          v-if="
            count(field.attribute.id) > 1 ||
            collisions?.has(field.attribute.id) ||
            repeatedUniquePriorities?.has(field.priority)
          "
          #before
        >
          <BaseMessage
            v-if="count(field.attribute.id) > 1"
            type="warning"
            :message="t('attributions.add.sameAgainWarning')"
          />
          <BaseMessage
            v-if="repeatedUniquePriorities?.has(field.priority)"
            type="error"
            :message="t('attributions.add.uniqueRepeated')"
          />
          <AttributionAddCollisionHint
            v-if="collisions?.get(field.attribute.id)"
            :collision="collisions.get(field.attribute.id)!"
            @edit="(attributionId) => $emit('editExisting', attributionId)"
          />
        </template>
      </AttributionInput>
    </li>
  </ul>
</template>

<script setup lang="ts">
import AttributionInput, {
  type AttributionInputValue,
} from 'src/components/Attribution/Input/AttributionInput.vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { type InputRef } from 'src/composables/useEntityForm';
import { useI18n } from 'src/composables/useI18n';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import AttributionAddCollisionHint from './AttributionAddCollisionHint.vue';
import type { Collision } from './findCollisions';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';

export interface AttributionAddFormFieldListProps {
  fields: {
    priority: number;
    required: boolean;
    attribute: AttributeFragment;
    exceptional: boolean;
  }[];
  noBottomBorder?: boolean;
  collisions?: Map<number, Collision<CachedAttributionsFragment>>;
  repeatedUniquePriorities?: Set<number>;
}

const props = defineProps<AttributionAddFormFieldListProps>();

defineEmits<{
  editExisting: [attributionId: number];
}>();

const inputRefs = defineModel<{ [key: number]: InputRef | null }>('inputRefs');
const modelValue = defineModel<{ [key: number]: AttributionInputValue }>({
  required: true,
});

function count(fieldId: number): number {
  return props.fields.filter((field) => field.attribute.id === fieldId).length;
}

const { t } = useI18n();
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
