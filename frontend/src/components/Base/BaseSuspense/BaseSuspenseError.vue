<template>
  <q-card class="text-white bg-red fixed-center" inline-actions flat>
    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-icon name="error" size="2em" />
        <span class="text-h6">{{
          error.name || t('base.suspenseWithError.title')
        }}</span>
      </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <BaseGraphqlError v-if="combinedError" :error="combinedError" />
      <div v-else>
        {{ error.message }}
      </div>
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
import { CombinedError } from '@urql/vue';
import { useI18n } from 'src/composables/useI18n';
import BaseGraphqlError from '../BaseGraphqlError.vue';
import { computed, onMounted } from 'vue';
const { t } = useI18n();

export interface BaseSuspenseErrorProps {
  error: Error | CombinedError;
}

const props = defineProps<BaseSuspenseErrorProps>();

const combinedError = computed(() => {
  return props.error instanceof CombinedError ? props.error : null;
});

onMounted(() => {
  console.error(props.error);
});

function reloadWindow() {
  window.location.reload();
}
</script>
