<template>
  <PageLayout>
    <h1>📸⬆️☁️⬇️🏞️</h1>
    <form @submit.prevent="onSubmit">
      <input ref="fileInput" type="file" required />
      <button type="submit">Upload</button>
      <button
        :disabled="!isUploading"
        :style="{ 'margin-left': '20px' }"
        @click="abortUpload"
      >
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
} from 'src/composables/useImageUploader';

const fileInput = ref<HTMLInputElement | null>(null);
const uploadState = ref<UploadProgress>({
  status: 'idle',
  percentComplete: 0,
  bytesTotal: 0,
  bytesUploaded: 0,
  errorMessage: '',
});
const message = ref<string>('');
const uploadedFile = ref<UploadResponse | null>(null);

const handleProgress = (progress: UploadProgress) => {
  uploadState.value = {
    ...uploadState.value,
    ...progress,
  };
  message.value = progress.errorMessage || '';
};

const { upload, abort } = useImageUploader(handleProgress);

const onSubmit = async () => {
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

  const file = fileInput.value.files[0];
  try {
    const response = await upload(file, '/api/assets/upload');
    message.value = 'Upload successful 🎉';
    uploadedFile.value = response;
  } catch (error) {
    console.warn('Upload failed:', error);
  }
};

const abortUpload = () => {
  abort();
};

const isUploading = computed(() => uploadState.value.status === 'uploading');
const isError = computed(() => uploadState.value.status === 'error');
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
