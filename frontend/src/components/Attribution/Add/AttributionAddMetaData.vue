<template>
  <EntityInput
    ref="authorRef"
    v-model.trim="author"
    :label="t('attributions.add.setAuthor')"
    required
    :rules="[
      (v: string) => !!v || t('base.required'),
      (v: string) => v.length <= 45 || t('base.validation.maxLen', { x: 45 }),
    ]"
    type="text"
    :maxlength="45"
  />

  <EntityInput
    ref="dateRef"
    v-model="date"
    :label="t('attributions.add.setDate')"
    :rules="[
      (v: string | null | undefined | Date) => !!v || t('base.required'),
      (v: string | null | undefined | Date) => defaultDateValidationRule(v),
    ]"
    required
    type="date"
  />

  <BaseInputLabel :label="t('attributions.add.repeat')">
    <q-toggle
      :model-value="showRepeat"
      :label="t('attributions.add.shouldRepeat')"
      @update:model-value="(v) => (repeat = v ? 100 : 0)"
    />
  </BaseInputLabel>

  <EntityInput
    v-if="showRepeat"
    ref="repeatRef"
    v-model="repeat"
    :hint="t('attributions.add.repeatHint')"
    :label="t('attributions.add.repeatCount')"
    required
    :rules="[
      (v: string | number | null | undefined) => !!v || t('base.required'),
      (v: string | number | null | undefined) => isInRepeatRangeRule(v),
    ]"
    type="number"
    :min="MIN_REPEAT"
    :max="MAX_REPEAT"
    :step="1"
  />
</template>
<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { EntityInputInstance } from 'src/components/Entity/Edit/EntityInput.vue';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { ref, computed } from 'vue';
import { useValidationRule } from 'src/composables/useValidationRule';

const MIN_REPEAT = 1;
const MAX_REPEAT = 1000;

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

const showRepeat = computed(
  () => repeat.value > 0 || Number.isNaN(repeat.value),
);

const { makeIntegerRule, defaultDateValidationRule } = useValidationRule();
const isInRepeatRangeRule = makeIntegerRule({
  min: MIN_REPEAT,
  max: MAX_REPEAT,
});
</script>
