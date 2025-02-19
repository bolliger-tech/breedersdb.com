<template>
  <div>
    <div
      class="attribute-form-input-photo relative-position bg-black rounded-borders"
      :style="!photo ? 'min-height: 200px;' : ''"
    >
      <img
        ref="preview"
        class="attribute-form-input-photo__preview"
        :class="{ hidden: modelValue === null }"
        @load="loading = false"
        @onerror="loading = false"
      />

      <q-icon
        v-if="!modelValue && !processing && !loading"
        name="photo_camera"
        size="50px"
        class="absolute-center"
        color="white"
      />

      <div v-if="processing || loading" class="absolute-center q-ma-none">
        <q-spinner size="3em" color="primary" />
      </div>

      <q-file
        ref="inputRef"
        :model-value="photo"
        :multiple="false"
        bg-color="transparent"
        input-style="opacity: 0"
        accept="image/jpeg,image/png"
        capture="environment"
        borderless
        dark
        class="attribute-form-input-photo__input"
        @update:model-value="updateModelValue"
      >
        <template v-if="modelValue" #append>
          <q-icon
            name="cancel"
            class="cursor-pointer attribute-form-input-photo__clear"
            @click.stop.prevent="clear"
          />
        </template>
      </q-file>
    </div>
    <BaseMessage v-if="isInvalidImage" type="error" :message="errorMessage" />
  </div>
</template>
<script setup lang="ts">
import { resizeImageFile } from 'src/utils/imageResizer';
import { watch, ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { hashFile } from 'src/composables/useImageUploader';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import type { QFile } from 'quasar';
import { getImageUrlRelative } from 'src/utils/imageUtils';

const MAX_IMAGE_SIZE = 3840; // longest side, 4k
const IMAGE_QUALITY = 0.9; // 0.0 - 1.0 (jpeg)

const modelValue = defineModel<File | string | null>({
  required: true,
});

const photo = ref<File | null>(null);

watch(modelValue, (value) => {
  photo.value = typeof value === 'string' ? null : value;
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

function clear() {
  modelValue.value = null;
  photo.value = null;
  emit('clear');
}

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
    errorMessage.value = t('attributions.add.invalidPhoto');
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

  if (modelValue.value instanceof File) {
    preview.value.src = URL.createObjectURL(modelValue.value);
    return;
  }

  preview.value.src = getImageUrlRelative({
    serverFileName: modelValue.value,
    desiredFileName: modelValue.value,
  });
}

watch([modelValue, preview], loadPreview, { immediate: true });

const loading = ref(!!modelValue.value);
</script>

<style scoped lang="scss">
.attribute-form-input-photo {
  line-height: 0;
  max-width: min(calc(100dvw - 64px), 400px);

  &__preview {
    max-width: min(calc(100dvw - 64px), 400px);
    max-height: min(calc(100dvw - 64px), 400px);
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

  &__clear {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    background: $negative;
    border-radius: 100%;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
