<template>
  <q-btn
    flat
    dense
    icon="photo"
    padding="none"
    :round="false"
    size="sm"
    :label="t('attributions.showImage')"
    @click="open = true"
  ></q-btn>
  <q-dialog v-model="open">
    <q-card>
      <q-card-section class="row justify-end q-pa-sm">
        <q-btn flat dense round icon="close" @click="open = false" />
      </q-card-section>

      <q-card-section>
        <!-- TODO: set correct image url -->
        <q-img
          :src="`/images/v1/${fileName}?hash=${fileHash}?w=1024`"
          spinner-color="white"
          style="max-width: 90wv; max-height: calc(90vh - 160px)"
        />
      </q-card-section>

      <q-card-actions align="right">
        <!-- TODO: set correct image url -->
        <a
          :href="`/images/v1/${fileName}?hash=${fileHash}`"
          :download="fileName"
          @click="open = false"
        >
          <q-btn
            flat
            :label="t('attributions.downloadAndClose')"
            color="primary"
          />
        </a>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';

export interface EntityViewAttributionImageProps {
  fileName: string;
  fileHash: string;
}

defineProps<EntityViewAttributionImageProps>();

const open = ref(false);
const { t } = useI18n();
</script>
