<template>
  <q-scroll-area
    v-if="images.length > 0"
    style="height: 216px; max-width: 100%; margin: 8px 16px"
  >
    <div class="row no-wrap q-gutter-sm scroll">
      <div v-for="image of images" :key="image.id">
        <EntityViewAttributionImage
          :attribution="image"
          :plant="plant"
          :plant-group="plantGroup"
          :cultivar="cultivar"
          :lot="lot"
          :crossing="crossing"
          preview
        />
      </div>
    </div>
  </q-scroll-area>
  <div v-else class="text-caption q-mx-md">
    <q-icon name="warning" size="sm" class="q-mr-sm" />{{
      t('entity.noImages')
    }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { EntityAttributionsViewFragment } from '../entityAttributionsViewFragment';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';

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
