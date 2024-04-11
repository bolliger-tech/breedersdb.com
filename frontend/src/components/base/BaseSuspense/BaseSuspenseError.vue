<template>
  <q-card class="text-white bg-red fixed-center" inline-actions flat>
    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-icon name="error" size="2em" />
        <span class="text-h6">{{ t('base.suspenseWithError.title') }}</span>
      </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div v-if="'graphQLErrors' in error && error.graphQLErrors.length">
        <div v-for="err in error.graphQLErrors" :key="err.message">
          {{ err.message }}
        </div>
      </div>
      <div v-else>{{ error.message }}</div>
    </q-card-section>
    <q-separator dark />
    <q-card-actions :align="'center'">
      <q-btn
        flat
        dense
        icon="refresh"
        :label="t('base.suspenseWithError.reload')"
        @click="reloadWindow"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { CombinedError } from '@urql/vue';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();

const { error } = defineProps({
  error: {
    type: Object as PropType<Error | CombinedError>,
    required: true,
  },
});

function reloadWindow() {
  window.location.reload();
}
</script>
