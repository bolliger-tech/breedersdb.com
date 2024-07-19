<template>
  <q-dialog v-model="modelValue">
    <q-card>
      <q-card-section class="row align-center justify-between">
        <h3
          class="q-my-sm"
          style="width: calc(100% - 34px); text-wrap: balance"
        >
          {{ t('base.qr.permanantlyEnableCameraOnIOS') }}
        </h3>
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-img
          src="content-images/enable-camera-ios-1.png"
          style="max-width: 100%"
        />
        <br /><br />
        <q-img
          src="content-images/enable-camera-ios-2.png"
          style="max-width: 100%"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          :label="t('base.close')"
          color="primary"
          flat
          @click="modelValue = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';

const modelValue = defineModel<boolean>({ required: true });

const { t } = useI18n();
</script>
