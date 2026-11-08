<template>
  <div>
    <div
      v-if="typeof modelValue === 'string'"
      class="row items-center q-mb-sm attribution-input-attachment__existing"
    >
      <AttributionAttachmentLink
        :file-name="modelValue"
        :attribute-name="attributeName"
        :entity-name="entityName"
        :date-attributed="dateAttributed ?? ''"
        :attribution-id="attributionId"
      />
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="cancel"
        color="negative"
        class="q-ml-sm"
        :aria-label="t('base.delete')"
        @click="modelValue = null"
      />
    </div>
    <q-file
      :model-value="file"
      :multiple="false"
      :label="t('attributions.add.selectAttachment')"
      :hint="file ? format.humanStorageSize(file.size) : undefined"
      :error="tooLarge"
      :error-message="
        t('attributions.add.attachmentTooLarge', {
          max: UPLOAD_MAX_SIZE / 1024 / 1024,
        })
      "
      outlined
      clearable
      hide-bottom-space
      @update:model-value="updateModelValue"
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import AttributionAttachmentLink from 'src/components/Attribution/AttributionAttachmentLink.vue';
import { UPLOAD_MAX_SIZE, isFileTooLarge } from 'src/utils/assetUtils';

export interface AttributionInputAttachmentProps {
  attributeName: string;
  entityName?: string | undefined;
  dateAttributed?: string | undefined;
  attributionId?: number | undefined;
}

defineProps<AttributionInputAttachmentProps>();

const modelValue = defineModel<File | string | null>({ required: true });

const { t } = useI18n();

const file = computed(() =>
  modelValue.value instanceof File ? modelValue.value : null,
);

const tooLarge = ref(false);

function updateModelValue(newFile: File | null) {
  tooLarge.value = !!newFile && isFileTooLarge(newFile);

  // the server rejects empty files
  modelValue.value = newFile?.size && !tooLarge.value ? newFile : null;
}
</script>
