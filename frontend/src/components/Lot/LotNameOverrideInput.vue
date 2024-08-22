<template>
  <EntityNameOverrideInput
    v-model="modelValue"
    :full-name="fullName"
    :maxlength="25"
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 25 || t('base.validation.maxLen', { x: 25 }),
      (val: string | null | undefined) =>
        !val ||
        /^[^\n\.]{1,25}$/.test(val) ||
        t('base.validation.noDotsOrNewLines'),
      async (val: string | null | undefined) =>
        !val ||
        (await isNameOverrideUnique(val)) ||
        t('base.validation.nameNotUnique'),
    ]"
    :loading="fetchingNameOverrideUnique"
    :hint="
      t('entity.nameOverrideHint.onNameOverride', {
        entity: t('base.entityName.lot', 1),
      })
    "
  />
</template>

<script setup lang="ts">
import EntityNameOverrideInput from '../Entity/Edit/EntityNameOverrideInput.vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { focusInView } from 'src/utils/focusInView';
import { InputRef } from 'src/composables/useEntityForm';

export interface LotNameInputProps {
  lotId: number | undefined;
  fullName: string | undefined;
}

const props = defineProps<LotNameInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<InputRef | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { isUnique: isNameOverrideUnique, fetching: fetchingNameOverrideUnique } =
  useIsUnique({
    tableName: 'lots',
    existingId: props.lotId || undefined,
    columnName: 'name_override',
  });

const { t } = useI18n();
</script>
