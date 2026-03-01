<template>
  <PageLayout>
    <h1 class="q-mr-lg">{{ t('settings.title') }}</h1>
    <h2>{{ t('settings.print.title') }}</h2>
    <BaseMessage type="warning" class="q-mb-md" v-if="!printBridge">
      {{ t('settings.print.noPrintBridge') }}
    </BaseMessage>
    <EntityInput
      :model-value="qrLabelTemplate"
      :label="t('settings.print.qrLabelTemplate')"
      type="text"
      readonly
      disable
      required
      :hint="`${t('base.readonly')}. ${t('settings.print.labelTemplateHint')}`"
      @click="copyToClipboard(qrLabelTemplate)"
    />
    <EntityInput
      :model-value="textLabelTemplate"
      :label="t('settings.print.textLabelTemplate')"
      type="text"
      readonly
      disable
      required
      :hint="`${t('base.readonly')}. ${t('settings.print.labelTemplateHint')}`"
      @click="copyToClipboard(textLabelTemplate)"
    />
    <div v-if="printBridge">
      <EntityInput
        :model-value="printBridgeUrl"
        :label="t('settings.print.bridgeUrl')"
        type="url"
        readonly
        disable
        required
        :hint="`${t('base.readonly')}.`"
        @click="copyToClipboard(printBridgeUrl)"
      />
      <q-btn
        :label="t('settings.print.selectPrinter')"
        @click="selectPrinter"
        color="primary"
        class="q-mt-sm"
      />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import {
  PRINT_SERVICE_TYPE_BRIDGE,
  usePrint,
} from 'src/composables/print/usePrint';
import { useQuasar } from 'quasar';

const print = usePrint();

const printBridge = print.type === PRINT_SERVICE_TYPE_BRIDGE ? print : null;

async function selectPrinter() {
  if (printBridge) {
    try {
      await printBridge.selectPrinter();
    } catch (error) {
      console.debug('No printer selected or an error occurred:', error);
    }
  }
}

const qrLabelTemplate = import.meta.env.VITE_LABEL_TEMPLATE_QR;
const textLabelTemplate = import.meta.env.VITE_LABEL_TEMPLATE_TEXT;
const printBridgeUrl = import.meta.env.VITE_PRINT_SERVICE_URL;

const { notify } = useQuasar();

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
  notify({
    type: 'positive',
    message: t('base.copiedToClipboard'),
  });
}

const { t } = useI18n();
</script>
