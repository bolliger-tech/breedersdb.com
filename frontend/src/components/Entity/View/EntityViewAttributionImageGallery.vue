<template>
  <q-scroll-area style="height: 200px; max-width: 100%">
    <div class="row no-wrap q-gutter-sm scroll">
      <div v-for="image of images" :key="image.id">
        <EntityViewAttributionImage
          :file-hash="image.text_value!"
          :file-name="
            imageFileName({
              row: image,
              plant,
              plantGroup,
              cultivar,
              lot,
              crossing,
            })
          "
          :note="image.note"
          :metadata="metadata({ row: image })"
          preview
        />
      </div>
      <div v-for="image of images" :key="image.id">
        <EntityViewAttributionImage
          :file-hash="image.text_value!"
          :file-name="
            imageFileName({
              row: image,
              plant,
              plantGroup,
              cultivar,
              lot,
              crossing,
            })
          "
          :note="image.note"
          :metadata="metadata({ row: image })"
          preview
        />
      </div>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { EntityAttributionsViewFragment } from '../entityAttributionsViewFragment';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';
import { imageFileName, metadata } from './imageHelpers';

export interface EntityViewAttributionsImageGalleryProps {
  images: EntityAttributionsViewFragment[];
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
}

defineProps<EntityViewAttributionsImageGalleryProps>();

const { t } = useI18n();
</script>
