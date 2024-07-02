<template>
  <div class="q-gutter-md">
    <q-btn-toggle
      v-model="inputMethod"
      :options="options"
      size="sm"
      toggle-color="primary"
    />

    <BaseInputLabel
      v-if="inputMethod === 'keyboard'"
      :label="t('plants.fields.labelId')"
    >
      <q-input
        v-model="labelId"
        :autofocus="true"
        inputmode="numeric"
        outlined
        type="number"
        @keyup.enter="loadPlant"
      />
    </BaseInputLabel>

    <BaseQrScanner v-else @change="onQrCode" />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { ref, watch } from 'vue';
import BaseInputLabel from '../Base/BaseInputLabel.vue';
import BaseQrScanner from '../Base/BaseQrScanner.vue';

const LOCALSTORAGE_KEY = 'breedersdb-plant-selector-input-method';

const { t } = useI18n();
const { localStorage } = useQuasar();

const inputMethod = ref<'camera' | 'keyboard'>(
  localStorage.getItem<'camera' | 'keyboard'>(LOCALSTORAGE_KEY) ?? 'camera',
);
watch(inputMethod, (v) => localStorage.set(LOCALSTORAGE_KEY, v));

const options = [
  { value: 'camera', label: t('plants.scanQrCode'), icon: 'qr_code_scanner' },
  { value: 'keyboard', label: t('plants.enterLabelId'), icon: 'keyboard' },
];

const labelId = ref<string>('');

function onQrCode(data: string) {
  labelId.value = data;
  loadPlant();
}

function loadPlant() {
  console.log('loadPlant', labelId.value);
}
</script>
