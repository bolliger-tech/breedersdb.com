<template>
  <PageLayout>
    <h1>📸⬆️☁️⬇️🏞️</h1>
    <form @submit.prevent="onSubmit">
      <input ref="fileInput" type="file" required />
      <button class="q-ml-lg" type="submit">Upload</button>
      <button :disabled="!isUploading" class="q-ml-lg" @click="abort">
        Abort
      </button>
    </form>
    <div class="progress-bar">
      <div class="progress-bar-fill" :style="{ width: progressWidth }">
        {{ uploadState.percentComplete }}%
      </div>
    </div>
    <div class="upload-details">
      Uploaded: {{ (uploadState.bytesUploaded / 1024 / 1024).toFixed(1) }} MB of
      {{ (uploadState.bytesTotal / 1024 / 1024).toFixed(1) }} MB
    </div>
    <div
      v-if="message"
      class="message"
      :class="{ 'error-message': isError, 'success-message': !isError }"
    >
      {{ message }}
    </div>
    <div v-if="uploadedFile">
      <h3>File Uploaded:</h3>
      <p>Filename: {{ uploadedFile.fileName }}</p>
      <p>
        URL:
        <a :href="uploadedFile.url" target="_blank">{{ uploadedFile.url }}</a>
      </p>
      <h3>File Downloaded:</h3>
      <img :src="uploadedFile.url" alt="Uploaded file" />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { ref, computed } from 'vue';
import {
  useImageUploader,
  UploadProgress,
  UploadResponse,
  hashFile,
} from 'src/composables/useImageUploader';
import { resizeImageFile } from 'src/utils/imageResizer';

const MAX_IMAGE_SIZE = 3840; // longest side, 4k
const IMAGE_QUALITY = 0.9; // 0.0 - 1.0 (jpeg)

const fileInput = ref<HTMLInputElement | null>(null);
const uploadState = ref<UploadProgress>({
  status: 'idle',
  percentComplete: 0,
  bytesTotal: 0,
  bytesUploaded: 0,
  errorMessage: '',
});
const message = ref('');
const isInvalidImage = ref(false);
const uploadedFile = ref<UploadResponse | null>(null);

function handleProgress(progress: UploadProgress) {
  uploadState.value = progress;
  message.value = progress.errorMessage || '';
}

const { upload, abort } = useImageUploader(handleProgress);

async function onSubmit() {
  if (!fileInput.value || !fileInput.value.files?.length) {
    uploadState.value = {
      status: 'error',
      errorMessage: 'Please select a file to upload.',
      percentComplete: 0,
      bytesTotal: 0,
      bytesUploaded: 0,
    };
    return;
  }

  message.value = '';
  uploadedFile.value = null;
  isInvalidImage.value = false;

  const file = fileInput.value.files[0];

  const resizedFile = await resizeImageFile(
    file,
    MAX_IMAGE_SIZE,
    MAX_IMAGE_SIZE,
    IMAGE_QUALITY,
    'image/jpeg',
  ).catch(() => {
    message.value = 'Invalid or unsupported image file.';
    isInvalidImage.value = true;
    return null;
  });

  if (!resizedFile) {
    return;
  }

  try {
    const fileHash = await hashFile(resizedFile);
    const response = await upload(resizedFile, fileHash, '/api/assets/upload');
    message.value = 'Upload successful 🎉';
    uploadedFile.value = response;
  } catch (error) {
    console.warn('Upload failed:', error);
  }
}

const isUploading = computed(() => uploadState.value.status === 'uploading');
const isError = computed(
  () => isInvalidImage.value || uploadState.value.status === 'error',
);
const progressWidth = computed(() => uploadState.value.percentComplete + '%');
</script>

<style scoped>
.progress-bar {
  width: 100%;
  background-color: #f3f3f3;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 10px;
}

.progress-bar-fill {
  height: 20px;
  width: 0;
  background-color: #4caf50;
  text-align: center;
  color: white;
  line-height: 20px;
  border-radius: 4px;
}

.message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
}

.error-message {
  background-color: #f44336;
  color: white;
}

.success-message {
  background-color: #4caf50;
  color: white;
}

.upload-details {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}
</style>
