<template>
  <q-file
    :model-value="modelValue?.file"
    :bg-color="inputBgColor"
    dense
    outlined
    :multiple="false"
    accept="image/jpeg"
    capture="environment"
    clearable
    :loading="processing"
    :error="isInvalidImage"
    :error-message="errorMessage"
    @update:model-value="updateModelValue"
  >
    <template #before>
      <q-icon name="photo_camera" />
    </template>
  </q-file>
</template>
<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { resizeImageFile } from 'src/composables/imageResizer';
import { defineModel, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { hashFile } from 'src/composables/useImageUploader';

const MAX_IMAGE_SIZE = 3840; // longest side, 4k
const IMAGE_QUALITY = 0.9; // 0.0 - 1.0 (jpeg)

const modelValue = defineModel<{ file: File; fileName: string } | null>({
  required: true,
});

const { t } = useI18n();

const processing = ref(false);
const errorMessage = ref('');
const isInvalidImage = ref(false);

async function updateModelValue(file: File | null) {
  if (!file) {
    modelValue.value = null;
    return;
  }

  processing.value = true;

  let resizedFile: File | null = null;
  try {
    resizedFile = await resizeImageFile(
      file,
      MAX_IMAGE_SIZE,
      MAX_IMAGE_SIZE,
      IMAGE_QUALITY,
      'image/jpeg',
    );
  } catch {
    errorMessage.value = t('attribute.invalidPhoto');
    isInvalidImage.value = true;
    processing.value = false;
  }

  if (!resizedFile) {
    modelValue.value = null;
    return;
  }

  // if this fails something went terribly wrong. so let it throw
  const fileHash = await hashFile(resizedFile);

  modelValue.value = {
    file: resizedFile,
    fileName: `${fileHash}.jpg`,
  };

  processing.value = false;
}

const { inputBgColor } = useInputBackground();
</script>
