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
        :key="String(isLocked(field.priority))"
        :disable="isLocked(field.priority)"
        :unmute-hint="isLocked(field.priority)"
        :display-value="lockedValues.get(field.priority)"
      >
        <template
          v-if="
            count(field.attribute.id) > 1 ||
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
        </template>
        <template
          v-if="collisions?.get(field.attribute.id)?.behavior === 'REPLACE'"
          #label-action
        >
          <q-btn
            color="primary"
            flat
            dense
            size="sm"
            class="attribution-add-replace-btn"
            :label="
              isLocked(field.priority)
                ? t('attributions.add.uniqueReplace.replaceValue')
                : t('base.cancel')
            "
            @click="
              isLocked(field.priority)
                ? emit('unlock', field.priority)
                : emit('lock', field.priority)
            "
          />
        </template>
        <template v-if="collisions?.has(field.attribute.id)" #hint>
          <AttributionAddCollisionHint
            :collision="collisions.get(field.attribute.id)!"
            :locked="isLocked(field.priority)"
          />
        </template>
      </AttributionInput>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  lockedPriorities?: Set<number>;
  repeatedUniquePriorities?: Set<number>;
}

const props = defineProps<AttributionAddFormFieldListProps>();

const emit = defineEmits<{
  unlock: [priority: number];
  lock: [priority: number];
}>();

const inputRefs = defineModel<{ [key: number]: InputRef | null }>('inputRefs');
const modelValue = defineModel<{ [key: number]: AttributionInputValue }>({
  required: true,
});

function count(fieldId: number): number {
  return props.fields.filter((field) => field.attribute.id === fieldId).length;
}

function isLocked(priority: number): boolean {
  return !!props.lockedPriorities?.has(priority);
}

// computed, so locked inputs get a stable object instead of a new one per render
const lockedValues = computed(
  () =>
    new Map(
      props.fields
        .filter((field) => isLocked(field.priority))
        .map((field) => [field.priority, toLockedValue(field.attribute)]),
    ),
);

// the existing value that locks the input, in the shape of an input value
function toLockedValue(attribute: AttributeFragment): AttributionInputValue {
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
