<template>
  <EntityInput
    ref="authorRef"
    v-model="author"
    :label="t('attribute.setAuthor')"
    required
    :rules="[
      (v: string) => !!v || t('base.required'),
      (v: string) => v.length <= 45 || t('base.validation.maxLen', { x: 45 }),
    ]"
    type="text"
    maxlength="45"
  />

  <EntityInput
    ref="dateRef"
    v-model="date"
    :label="t('attribute.setDate')"
    :rules="[(v: string) => !!v || t('base.required')]"
    required
    type="date"
  />

  <BaseInputLabel :label="t('attribute.repeat')">
    <q-toggle
      :model-value="repeat > 0"
      :label="t('attribute.shouldRepeat')"
      @update:model-value="(v) => (repeat = v ? 100 : 0)"
    />
  </BaseInputLabel>

  <EntityInput
    v-if="repeat > 0"
    ref="repeatRef"
    v-model="repeat"
    :hint="t('attribute.repeatHint')"
    :label="t('attribute.repeatCount')"
    required
    :rules="[
      (v: number) => !!v || t('base.required'),
      (v: number) => v > 0 || t('base.validation.min', { x: 1 }),
      (v: number) => v <= 1000 || t('base.validation.max', { x: 1000 }),
      (v: number) => Number.isInteger(v) || t('base.validation.integer'),
    ]"
    type="number"
    min="1"
    max="1000"
    step="1"
  />
</template>
<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityInput, {
  EntityInputInstance,
} from '../Entity/Edit/EntityInput.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { ref } from 'vue';

const { t } = useI18n();

const author = defineModel<string | null>('author', { required: true });
const date = defineModel<string | null>('date', { required: true });
const repeat = defineModel<number>('repeat', { required: true });

const authorRef = ref<EntityInputInstance | null>(null);
const dateRef = ref<EntityInputInstance | null>(null);
const repeatRef = ref<EntityInputInstance | null>(null);

defineExpose({
  validate: () => {
    return Promise.all([
      Promise.resolve(authorRef.value?.validate()),
      Promise.resolve(dateRef.value?.validate()),
      Promise.resolve(repeatRef.value?.validate() ?? true),
    ]).then((results) => results.every((r) => r));
  },
});
</script>
