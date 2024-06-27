<template>
  <EntityInput
    ref="inputRef"
    v-model="labelId"
    :label="t('plants.fields.labelId')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('plants.fields.labelId') }),
      (val: string) =>
        (/^#?[0-9]{1,8}$/.test(val) && parseInt(val.replace(/^#/, '')) > 0) ||
        t('plants.errors.labelId'),
    ]"
    type="text"
    autocomplete="off"
    :hint="t('plants.hints.labelId')"
    @blur="zeroFill"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityInput, {
  EntityInputInstance,
} from '../Entity/Edit/EntityInput.vue';
import { ref } from 'vue';

const labelId = defineModel<string>({
  required: true,
});

const inputRef = ref<EntityInputInstance | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
});

const { t } = useI18n();

function zeroFill() {
  if (!labelId.value) {
    return;
  }

  const prefix = labelId.value.startsWith('#') ? '#' : '';
  labelId.value = `${prefix}${parseInt(labelId.value.replace(/^#/, '')).toString().padStart(8, '0')}`;
}
</script>
