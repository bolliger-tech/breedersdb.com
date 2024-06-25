<template>
  <q-scroll-area style="height: 200px; max-width: 100%">
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
</template>

<script setup lang="ts">
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
</script>
