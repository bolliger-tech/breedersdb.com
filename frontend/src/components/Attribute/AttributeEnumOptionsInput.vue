<template>
  <BaseInputLabel :label="t('attributes.enumOptions.label')">
    <BaseSortableListItem
      v-for="(option, idx) in modelValue"
      :key="option.id ?? option._uid ?? `new-${idx}`"
      :drop-zone-active="currentDragItemId !== null"
      :not-draggable="modelValue.length < 2"
      :no-space-before="modelValue.length < 2"
      :any-drag-active="currentDragItemId !== null"
      :last="idx === modelValue.length - 1"
      @dragstart="currentDragItemId = idx"
      @dragend="currentDragItemId = null"
      @drop="(pos) => onDrop(pos, idx)"
    >
      <EntityInput
        :ref="(el: InputRef) => (refs[idx] = el)"
        class="col"
        :model-value="option.label"
        :placeholder="t('attributes.enumOptions.optionPlaceholder')"
        type="text"
        autocomplete="off"
        hide-bottom-space
        :rules="[
          (v: string) =>
            !!v ||
            t('base.validation.xIsRequired', {
              x: t('attributes.enumOptions.optionPlaceholder'),
            }),
          (v: string) =>
            /^[^\n]{1,45}$/.test(v) ||
            t('base.validation.noNewLinesMaxLength', { max: 45 }),
          (v: string) =>
            isLabelUnique(v, idx) || t('attributes.enumOptions.duplicateLabel'),
        ]"
        @update:model-value="
          (v) => updateOption(idx, { label: (v ?? '').toString() })
        "
        @blur="updateOption(idx, { label: option.label.trim() })"
      />
      <q-btn
        class="col-auto q-ml-xs"
        color="negative"
        style="top: 0.75em"
        dense
        flat
        rounded
        icon="delete_outline"
        :disable="isUsed(option)"
        @click="removeOption(idx)"
      >
        <q-tooltip v-if="isUsed(option)">
          {{ t('attributes.enumOptions.deleteUsedNotAllowed') }}
        </q-tooltip>
      </q-btn>

      <template #controls>
        <div class="row items-center q-gutter-x-md">
          <q-checkbox
            :model-value="option.is_default"
            :label="t('attributes.enumOptions.preSelected')"
            size="sm"
            @update:model-value="(v: boolean) => setDefault(idx, v)"
          />
          <q-checkbox
            :model-value="option.disabled"
            :label="t('attributes.enumOptions.disabled')"
            size="sm"
            @update:model-value="
              (v: boolean) => updateOption(idx, { disabled: v })
            "
          >
            <q-tooltip>{{
              t('attributes.enumOptions.disabledExplainer')
            }}</q-tooltip>
          </q-checkbox>
        </div>
      </template>
    </BaseSortableListItem>

    <div v-if="emptyError" class="text-negative text-caption q-mb-xs">
      {{ t('attributes.enumOptions.noOptions') }}
    </div>

    <q-btn
      outline
      no-caps
      icon="add"
      color="primary"
      class="full-width"
      :label="t('attributes.enumOptions.addOption')"
      @click="addOption"
    />
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, nextTick, onMounted, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import BaseSortableListItem from 'src/components/Base/BaseSortableListItem.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import type { EnumOptionInput } from './enumOption';

export interface AttributeEnumOptionsInputProps {
  attributeId?: number | undefined;
}

const props = defineProps<AttributeEnumOptionsInputProps>();

const modelValue = defineModel<EnumOptionInput[]>({ required: true });

const { t } = useI18n();

const refs = ref<{ [key: number]: InputRef | null }>({});
const emptyError = ref(false);
const currentDragItemId = ref<number | null>(null);

let uidCounter = 0;
function nextUid() {
  return --uidCounter;
}

defineExpose({
  validate: async () => {
    emptyError.value = modelValue.value.length === 0;
    const childrenValid = (
      await Promise.all(
        Object.values(refs.value).map(
          async (ref) => (await ref?.validate?.()) ?? true,
        ),
      )
    ).every(Boolean);
    return childrenValid && !emptyError.value;
  },
  focus: () => refs.value[0]?.focus?.(),
});

function setOptions(options: EnumOptionInput[]) {
  // keep position in sync with the visible order
  modelValue.value = options.map((o, position) => ({ ...o, position }));
  if (modelValue.value.length > 0) emptyError.value = false;
}

function updateOption(idx: number, patch: Partial<EnumOptionInput>) {
  const next = [...modelValue.value];
  const current = next[idx];
  if (!current) return;
  next[idx] = { ...current, ...patch };
  setOptions(next);
}

function setDefault(idx: number, value: boolean) {
  // only one option can be the default
  setOptions(
    modelValue.value.map((o, i) => ({ ...o, is_default: value && i === idx })),
  );
}

function appendEmptyOption() {
  setOptions([
    ...modelValue.value,
    {
      label: '',
      position: modelValue.value.length,
      disabled: false,
      is_default: false,
      _uid: nextUid(),
    },
  ]);
  emptyError.value = false;
}

async function addOption() {
  appendEmptyOption();
  await nextTick();
  refs.value[modelValue.value.length - 1]?.focus?.();
}

// Start a fresh enum with one (empty) option visible, so the editor isn't blank.
// Existing attributes load with their saved options, so this only seeds new ones.
onMounted(() => {
  if (modelValue.value.length === 0) appendEmptyOption();
});

function removeOption(idx: number) {
  setOptions(modelValue.value.filter((_, i) => i !== idx));
}

function onDrop(pos: 'before' | 'after', dropIndex: number) {
  if (currentDragItemId.value === null) return;

  const dragIndex = currentDragItemId.value;
  const next = [...modelValue.value];
  const dragItem = next[dragIndex];
  if (!dragItem) return;
  if (dragIndex < dropIndex) dropIndex--;
  next.splice(dragIndex, 1);
  next.splice(dropIndex + (pos === 'after' ? 1 : 0), 0, dragItem);
  setOptions(next);
}

function isLabelUnique(label: string, idx: number) {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return true;
  return !modelValue.value.some(
    (o, i) => i !== idx && o.label.trim().toLowerCase() === normalized,
  );
}

// determine which options are already used by attributions, so they can't be deleted
const usageQuery = graphql(`
  query EnumOptionUsage($attributeId: Int!) {
    attribution_values(
      where: {
        attribute_id: { _eq: $attributeId }
        attribute_enum_option_id: { _is_null: false }
      }
      distinct_on: [attribute_enum_option_id]
    ) {
      attribute_enum_option_id
    }
  }
`);

const { data: usageData } = useQuery({
  query: usageQuery,
  variables: computed(() => ({ attributeId: props.attributeId ?? -1 })),
  pause: computed(() => !props.attributeId),
  context: { additionalTypenames: ['attribution_values'] },
  requestPolicy: 'cache-and-network',
});

const usedIds = computed(
  () =>
    new Set(
      (usageData.value?.attribution_values ?? [])
        .map((v) => v.attribute_enum_option_id)
        .filter((id): id is number => id !== null),
    ),
);

function isUsed(option: EnumOptionInput) {
  return option.id !== undefined && usedIds.value.has(option.id);
}
</script>
