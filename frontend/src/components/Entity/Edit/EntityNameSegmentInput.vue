<template>
  <BaseInputLabel :label="t('entity.commonColumns.fullName')">
    <template #explainer>
      <i18n-t keypath="entity.nameExplainerIntro.base" scope="global">
        <template #structuredName
          ><strong>{{
            t('entity.nameExplainerIntro.structuredName')
          }}</strong></template
        >
        <template #displayName
          ><strong>{{
            t('entity.nameExplainerIntro.displayName')
          }}</strong></template
        >
      </i18n-t>
      <div class="q-mt-md">
        <strong>{{ t('entity.commonColumns.fullName') }}</strong>
        <ul>
          <slot name="explainerFullNameListItems"></slot>
          <li>{{ t('entity.nameOverrideHint.onNameSegment') }}</li>
        </ul>
      </div>
    </template>

    <template #default>
      <q-input
        ref="inputRef"
        v-model="modelValue"
        :bg-color="inputBgColor"
        dense
        outlined
        bottom-slots
        :dark="$q.dark.isActive"
        autocomplete="off"
        :rules="rules"
        type="text"
        required
        :mask="mask"
        :fill-mask="fillMask"
        :unmasked-value="unmaskedValue"
        :loading="loading"
      >
        <template v-if="prefix" #prepend>
          <div style="font-size: 14px; opacity: 0.9">
            {{ prefix }}<strong style="padding-left: 6px">.</strong>
          </div>
        </template>

        <template v-if="nextFreeNameSegment" #append>
          <q-btn
            :label="t('entity.autoFillNextSegment')"
            flat
            dense
            @click="modelValue = nextFreeNameSegment"
          />
        </template>

        <template v-if="$slots.inputHint" #hint>
          <slot name="inputHint"></slot>
        </template>

        <template v-if="fetchError" #error>
          {{ t('entity.nameSegmentDataError') }}
        </template>
      </q-input>
    </template>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { useI18n } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';
import { ref } from 'vue';
import type { QInput, QInputProps } from 'quasar';
import { focusInView } from 'src/utils/focusInView';

export interface EntityNameSegmentInputProps {
  rules: QInputProps['rules'];
  mask?: QInputProps['mask'];
  fillMask?: QInputProps['fillMask'];
  unmaskedValue?: QInputProps['unmaskedValue'];
  loading: QInputProps['loading'];
  prefix: string | null;
  nextFreeNameSegment: string | null;
  fetchError: boolean;
}

defineProps<EntityNameSegmentInputProps>();
const modelValue = defineModel<string>({ required: true });

const inputRef = ref<QInput | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

defineSlots<{
  explainerFullNameListItems: void;
  inputHint: void;
  inputError: void;
}>();

const { inputBgColor } = useInputBackground();
const { t } = useI18n();
</script>
