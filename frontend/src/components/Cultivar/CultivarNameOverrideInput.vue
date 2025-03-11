<template>
  <EntityNameOverrideInput
    ref="inputRef"
    v-model="modelValue"
    :full-name="fullName"
    :maxlength="51"
    :rules="[
      (val: string | null | undefined) =>
        required && !val
          ? t('base.validation.xIsRequired', {
              x: t('entity.commonColumns.explicitDisplayName'),
            })
          : true,
      (val: string | null | undefined) =>
        !val || val.length <= 51 || t('base.validation.maxLen', { x: 51 }),
      (val: string | null | undefined) =>
        !val ||
        /^[^\n\.]{1,51}$/.test(val) ||
        t('base.validation.noDotsOrNewLines'),
      async (val: string | null | undefined) =>
        !val ||
        (await isNameOverrideUnique(val)) ||
        t('base.validation.nameNotUnique'),
    ]"
    :loading="loading || fetchingNameOverrideUnique"
    :hint="
      hint ??
      t('entity.nameOverrideHint.onNameOverride', {
        entity: t('base.entityName.cultivar', 1),
      })
    "
    :required="required"
  />
</template>

<script setup lang="ts">
import EntityNameOverrideInput from 'src/components/Entity/Edit/EntityNameOverrideInput.vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { focusInView } from 'src/utils/focusInView';
import type { InputRef } from 'src/composables/useEntityForm';

export interface CultivarNameInputProps {
  cultivarId: number | undefined;
  fullName: string | undefined;
  hint?: string;
  loading?: boolean;
  required?: boolean;
}

const props = defineProps<CultivarNameInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<InputRef | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { isUnique: isNameOverrideUnique, fetching: fetchingNameOverrideUnique } =
  useIsUnique({
    tableName: 'cultivars',
    existingId: props.cultivarId || undefined,
    columnName: 'name_override',
  });

const { t } = useI18n();
</script>
