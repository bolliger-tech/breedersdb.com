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
        :disable="isBlocked(field.attribute.id)"
        :unmute-hint="isBlocked(field.attribute.id)"
        :display-value="blockingValue(field.attribute)"
      >
        <template
          v-if="
            count(field.attribute.id) > 1 ||
            (collisions?.has(field.attribute.id) &&
              !isBlocked(field.attribute.id)) ||
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
            v-if="
              collisions?.has(field.attribute.id) &&
              !isBlocked(field.attribute.id)
            "
            :collision="collisions.get(field.attribute.id)!"
          />
        </template>
        <template v-if="isBlocked(field.attribute.id)" #hint>
          <AttributionAddCollisionHint
            :collision="collisions!.get(field.attribute.id)!"
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

const inputRefs = defineModel<{ [key: number]: InputRef | null }>('inputRefs');
const modelValue = defineModel<{ [key: number]: AttributionInputValue }>({
  required: true,
});

function count(fieldId: number): number {
  return props.fields.filter((field) => field.attribute.id === fieldId).length;
}

function isBlocked(attributeId: number): boolean {
  return props.collisions?.get(attributeId)?.behavior === 'BLOCK';
}

// the existing value that blocks the input, in the shape of an input value
function blockingValue(attribute: AttributeFragment): AttributionInputValue {
  if (!isBlocked(attribute.id)) return undefined;

  const existing = props.collisions!.get(attribute.id)!.existingValue;

  // cached attributions hold the photo file name and the enum option label
  // in text_value
  if (attribute.data_type === 'PHOTO') {
    return { photo_value: existing.text_value };
  }
  if (attribute.data_type === 'ENUM') {
    return {
      attribute_enum_option_id:
        attribute.enum_options.find((o) => o.label === existing.text_value)
          ?.id ?? null,
    };
  }

  return {
    integer_value: existing.integer_value,
    float_value: existing.float_value,
    text_value: existing.text_value,
    boolean_value: existing.boolean_value,
    date_value: existing.date_value,
  };
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
