<template>
  <!-- TODO: set correct image url, set height! -->
  <img
    v-if="preview"
    v-ripple
    src="https://pomaculta.org/wp-content/uploads/2019/02/cropped-Bild_Scho__nheit_und_Ertrag-300x180.jpg"
    class="cursor-pointer"
    @click="open = true"
  />
  <q-btn
    v-else
    flat
    dense
    icon="photo"
    padding="none"
    :round="false"
    size="sm"
    :label="t('base.show')"
    @click="open = true"
  />

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
          <span v-if="attribution.note">{{ attribution.note }}</span
          >&nbsp;
          <span class="text-muted">{{ metadata }}</span>
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <!-- TODO: set correct image url -->
        <a
          :href="`/images/v1/${fileName}?hash=${attribution.text_value}`"
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
import { computed, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { EntityAttributionsViewFragment } from '../entityAttributionsViewFragment';

export interface EntityViewAttributionImageProps {
  attribution: EntityAttributionsViewFragment;
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
  preview?: boolean;
}

const props = defineProps<EntityViewAttributionImageProps>();

const open = ref(false);
const { t } = useI18n();

const fileName = computed(() => {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const entityName =
    props.plant?.label_id ??
    props.plantGroup?.display_name ??
    props.cultivar?.display_name ??
    props.lot?.display_name ??
    props.crossing?.name ??
    'unknown';

  return `${org}-${entityName}-${props.attribution.attribute_name}-${props.attribution.date_attributed}-${props.attribution.id}.jpg`;
});

const metadata = computed(() => {
  return `${props.attribution.attribute_name}, ${props.attribution.date_attributed} ${props.attribution.author}`;
});
</script>
