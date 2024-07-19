<template>
  <div>
    <div
      class="attribute-form-input-photo relative-position bg-black rounded-borders"
      :style="!modelValue ? 'min-height: 200px;' : ''"
    >
      <img
        ref="preview"
        class="attribute-form-input-photo__preview"
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
        ref="inputRef"
        :model-value="modelValue"
        :multiple="false"
        bg-color="transparent"
        input-style="opacity: 0"
        accept="image/jpeg,image/png"
        capture="environment"
        clearable
        borderless
        dark
        class="attribute-form-input-photo__input"
        @update:model-value="updateModelValue"
        @clear="$emit('clear')"
      />
    </div>
    <div v-if="isInvalidImage" class="text-negative text-caption">
      <q-icon name="warning" />&nbsp;{{ errorMessage }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { resizeImageFile } from 'src/composables/imageResizer';
import { watch, ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { hashFile } from 'src/composables/useImageUploader';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import type { QFile } from 'quasar';

const MAX_IMAGE_SIZE = 3840; // longest side, 4k
const IMAGE_QUALITY = 0.9; // 0.0 - 1.0 (jpeg)

const modelValue = defineModel<File | null>({
  required: true,
});

const emit = defineEmits<{ clear: []; cancel: [] }>();

const inputRef = ref<QFile | null>(null);
defineExpose({ pickFiles: () => inputRef.value?.pickFiles() });

const emitCancle = () => emit('cancel');
watch(inputRef, () => {
  inputRef.value?.nativeEl.addEventListener('cancel', emitCancle);
});
onBeforeUnmount(() => {
  inputRef.value?.nativeEl.removeEventListener('cancel', emitCancle);
});

const { t } = useI18n();

const processing = ref(false);
const errorMessage = ref('');
const isInvalidImage = ref(false);

async function updateModelValue(file: File | null) {
  if (!file || file.size === 0) {
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

  // create new file with the final name
  modelValue.value = new File([resizedFile], `${fileHash}.jpg`, {
    type: 'image/jpeg',
  });

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

  preview.value.src = URL.createObjectURL(modelValue.value);
}

watch(modelValue, loadPreview, { immediate: true });
</script>

<style scoped lang="scss">
.attribute-form-input-photo {
  line-height: 0;
  max-width: min(calc(100svw - 64px), 400px);

  &__preview {
    max-width: min(calc(100svw - 64px), 400px);
    max-height: min(calc(100svw - 64px), 400px);
    transform: translateX(-50%);
    left: 50%;
    position: relative;
  }

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
