<template>
  <q-btn
    flat
    dense
    round
    icon="qr_code_scanner"
    style="vertical-align: text-top"
    @click="open = true"
  />
  <q-dialog v-model="open">
    <q-card>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <h3 class="col" style="margin: 0">{{ t('base.qr.title') }}</h3>
          <q-btn icon="close" flat round dense @click="open = false" />
        </div>

        <BaseQrScanner
          max-width-height="min(calc(100svw - 80px), calc(100svh - 130px), 400px)"
          @change="onChange"
        />
      </q-card-section>
      <q-separator />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseQrScanner from './BaseQrScanner.vue';
import { ref } from 'vue';

const open = ref(false);

const emit = defineEmits<{
  change: [data: string];
}>();

function onChange(data: string) {
  emit('change', data);
  open.value = false;
}

const { t } = useI18n();
</script>
