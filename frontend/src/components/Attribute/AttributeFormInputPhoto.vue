<template>
  <div
    class="attribute-form-input-photo relative-position bg-black"
    :style="!modelValue ? 'min-height: 200px;' : ''"
  >
    <img
      ref="preview"
      style="
        max-width: min(calc(100svw - 64px), 400px);
        max-height: min(calc(100svw - 64px), 400px);
        transform: translateX(-50%);
        left: 50%;
        position: relative;
      "
      :class="{ hidden: modelValue === null }"
    />

    <q-icon
      v-if="!modelValue && !processing"
      name="photo_camera"
      size="50px"
      class="absolute-center"
      color="white"
    />

    <BaseSpinner
      v-if="processing"
      class="absolute-center q-ma-none"
      style="line-height: 1"
      size="xl"
    />

    <q-file
      :model-value="modelValue?.file"
      :multiple="false"
      bg-color="transparent"
      input-style="opacity: 0"
      accept="image/jpeg"
      capture="environment"
      clearable
      borderless
      dark
      class="attribute-form-input-photo__input"
      @update:model-value="updateModelValue"
    />
  </div>
  <div v-if="isInvalidImage" class="text-negative text-caption">
    <q-icon name="warning" />&nbsp;{{ errorMessage }}
  </div>
</template>
<script setup lang="ts">
import { resizeImageFile } from 'src/composables/imageResizer';
import { watch, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { hashFile } from 'src/composables/useImageUploader';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';

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

const preview = ref<HTMLImageElement | null>(null);

function loadPreview() {
  if (!preview.value) {
    return;
  }

  if (!modelValue.value) {
    preview.value.src = '';
    return;
  }

  preview.value.src = URL.createObjectURL(modelValue.value.file);
}

watch(modelValue, loadPreview, { immediate: true });
</script>

<style scoped lang="scss">
.attribute-form-input-photo {
  line-height: 0;
  max-width: min(calc(100svw - 64px), 400px);

  &__input {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
}

:global(.attribute-form-input-photo .q-field__append) {
  margin-right: 0.75em;
}

:global(.attribute-form-input-photo .q-field__append .q-icon) {
  background: black;
  border-radius: 100%;
}
</style>
