<template>
  <BaseInputLabel :label="t('attributes.enumOptions.label')">
    <div
      v-for="(option, idx) in modelValue"
      :key="option.id ?? `new-${idx}`"
      class="row items-center no-wrap q-gutter-sm q-mb-xs"
    >
      <EntityInput
        :ref="(el: InputRef) => (refs[idx] = el)"
        class="col"
        :model-value="option.label"
        :label="`${t('attributes.enumOptions.optionPlaceholder')} ${idx + 1}`"
        type="text"
        autocomplete="off"
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
      <q-toggle
        :model-value="option.is_default"
        :label="t('attributes.enumOptions.default')"
        dense
        @update:model-value="(v: boolean) => setDefault(idx, v)"
      />
      <q-toggle
        :model-value="option.disabled"
        :label="t('attributes.enumOptions.disabled')"
        dense
        @update:model-value="(v: boolean) => updateOption(idx, { disabled: v })"
      >
        <q-tooltip>{{
          t('attributes.enumOptions.disabledExplainer')
        }}</q-tooltip>
      </q-toggle>
      <q-btn
        flat
        round
        dense
        icon="delete"
        color="negative"
        :disable="isUsed(option)"
        @click="removeOption(idx)"
      >
        <q-tooltip v-if="isUsed(option)">
          {{ t('attributes.enumOptions.deleteUsedNotAllowed') }}
        </q-tooltip>
      </q-btn>
    </div>

    <div v-if="emptyError" class="text-negative text-caption q-mt-xs">
      {{ t('attributes.enumOptions.noOptions') }}
    </div>

    <q-btn
      flat
      dense
      no-caps
      icon="add"
      color="primary"
      class="q-mt-sm"
      :label="t('attributes.enumOptions.addOption')"
      @click="addOption"
    />
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import type { InputRef } from 'src/composables/useEntityForm';

export type EnumOptionInput = {
  id?: number;
  label: string;
  position: number;
  disabled: boolean;
  is_default: boolean;
};

export interface AttributeEnumOptionsInputProps {
  attributeId?: number | undefined;
}

const props = defineProps<AttributeEnumOptionsInputProps>();

const modelValue = defineModel<EnumOptionInput[]>({ required: true });

const { t } = useI18n();

const refs = ref<{ [key: number]: InputRef | null }>({});
const emptyError = ref(false);

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

function addOption() {
  setOptions([
    ...modelValue.value,
    {
      label: '',
      position: modelValue.value.length,
      disabled: false,
      is_default: false,
    },
  ]);
  emptyError.value = false;
}

function removeOption(idx: number) {
  setOptions(modelValue.value.filter((_, i) => i !== idx));
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
