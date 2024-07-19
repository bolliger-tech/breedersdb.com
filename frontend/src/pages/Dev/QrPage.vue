<template>
  <div class="q-mx-md">
    <h1>QrScanner</h1>
    <q-btn label="Toggle scanner" @click="toggleScanner" />
    <q-btn label="Clear scanned" @click="data = []" />
    <q-btn label="Toggle error" @click="toggleError" />
    <div class="q-my-md">
      <BaseQrScanner
        v-if="enabled"
        :error-message="errorMessage"
        :error="!!errorMessage"
        @change="change"
      />
    </div>
    <h3>Scanned</h3>
    <pre>{{ data.slice().reverse().join('\n') }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseQrScanner from 'src/components/Base/BaseQrScanner.vue';

const errorMessage = ref<string | undefined>(undefined);
const enabled = ref<boolean>(true);
const data = ref<string[]>([]);

function toggleScanner() {
  enabled.value = !enabled.value;
}
function toggleError() {
  if (errorMessage.value) {
    errorMessage.value = undefined;
  } else {
    errorMessage.value = 'Test error message';
  }
}
function change(d: string) {
  if (d && !data.value.includes(d)) {
    data.value.push(d);
  }
  if (data.value.length > 10) {
    data.value.shift();
  }
}
</script>
