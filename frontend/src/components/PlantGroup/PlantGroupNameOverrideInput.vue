<template>
  <EntityNameOverrideInput
    v-model="modelValue"
    :full-name="fullName"
    :rules="[
      (val: string | null | undefined) =>
        !val || val.length <= 77 || t('base.validation.maxLen', { x: 77 }),
      (val: string | null | undefined) =>
        !val ||
        /^[^\n\.]{1,77}$/.test(val) ||
        t('base.validation.noDotsOrNewLines'),
      async (val: string | null | undefined) =>
        !val ||
        (await isNameOverrideUnique(val)) ||
        t('base.validation.nameNotUnique'),
    ]"
    :loading="fetchingNameOverrideUnique"
    :hint="
      t('entity.nameOverrideHint.onNameOverride', {
        entity: t('base.entityName.plantGroup', 1),
      })
    "
  />
</template>

<script setup lang="ts">
import EntityNameOverrideInput from 'src/components/Entity/Edit/EntityNameOverrideInput.vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { focusInView } from 'src/utils/focusInView';
import { InputRef } from 'src/composables/useEntityForm';

export interface PlantGroupNameInputProps {
  plantGroupId: number | undefined;
  fullName: string | undefined;
}

const props = defineProps<PlantGroupNameInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<InputRef | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { isUnique: isNameOverrideUnique, fetching: fetchingNameOverrideUnique } =
  useIsUnique({
    tableName: 'plant_groups',
    existingId: props.plantGroupId || undefined,
    columnName: 'name_override',
  });

const { t } = useI18n();
</script>
