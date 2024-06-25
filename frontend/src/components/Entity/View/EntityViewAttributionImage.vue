<template>
  <q-btn
    flat
    dense
    icon="photo"
    padding="none"
    :round="false"
    size="sm"
    :label="t('base.show')"
    @click="open = true"
  ></q-btn>
  <q-dialog v-model="open">
    <q-card
      style="width: clamp(300px, calc(90vw - 20px), 980px); max-width: unset"
    >
      <q-card-section class="row justify-end q-pa-sm">
        <q-btn flat dense round icon="close" @click="open = false" />
      </q-card-section>

      <q-card-section>
        <!-- TODO: set correct image url -->
        <!-- :src="`/api/v1/assets/image/${fileName}?hash=${fileHash}?w=1024`"
          :srcset="`
            /api/v1/assets/image/${fileName}?hash=${fileHash}?w=320 320w,
            /api/v1/assets/image/${fileName}?hash=${fileHash}?w=768 768w,
            /api/v1/assets/image/${fileName}?hash=${fileHash}?w=1024 1024w,
            /api/v1/assets/image/${fileName}?hash=${fileHash}?w=2560 2560w,
          `" -->
        <q-img
          src="https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag.jpg"
          srcset="https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag.jpg 2000w, https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag-300x180.jpg 300w, https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag-768x461.jpg 768w, https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag-1024x614.jpg 1024w"
          sizes="clamp(300px, calc(90vw - 20px), 980px)"
          spinner-color="white"
          fit="contain"
          style="
            max-width: clamp(300px, calc(90vw - 52px), 980px);
            max-height: calc(90vh - 200px);
          "
        />
        <p class="text-caption q-ma-none text-center">
          <span v-if="note">{{ note }}</span
          >&nbsp;
          <span class="text-muted">{{ metadata }}</span>
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <!-- TODO: set correct image url -->
        <a
          :href="`/images/v1/${fileName}?hash=${fileHash}`"
          :download="fileName"
        >
          <q-btn flat :label="t('base.download')" color="primary" />
        </a>
        <q-btn
          flat
          :label="t('base.close')"
          color="primary"
          @click="open = false"
        />
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
  note: string | null;
  metadata: string;
}

defineProps<EntityViewAttributionImageProps>();

const open = ref(false);
const { t } = useI18n();
</script>
