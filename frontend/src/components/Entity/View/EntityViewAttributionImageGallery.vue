<template>
  <q-scroll-area
    v-if="images.length > 0"
    style="height: 216px; max-width: 100%; margin: 8px 16px"
  >
    <div class="row no-wrap q-gutter-sm scroll">
      <div
        v-for="(image, index) in images.filter(
          (img) => img.text_value || img.photo_note,
        )"
        :key="image.id"
      >
        <EntityViewAttributionImage
          :file-name="(image.photo_note || image.text_value)!"
          :attribution="image"
          preview
          :preview-size="imageSizes.h200"
          :model-value="open === image.id"
          :transition="transition"
          :transition-duration="TRANSITION_DURATION"
          @update:model-value="(val: boolean) => (open = val ? image.id : null)"
          @next="show(images[(index + 1) % images.length]?.id, 'left')"
          @previous="
            show(
              images[(index - 1 + images.length) % images.length]?.id,
              'right',
            )
          "
        />
      </div>
    </div>
  </q-scroll-area>
  <div v-else class="text-caption q-mx-md">
    {{ t('entity.noImages') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import type { EntityViewAttributionImageProps } from './EntityViewAttributionImage.vue';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';
import { ref } from 'vue';
import { useTimeout } from 'quasar';
import { onBeforeUnmount } from 'vue';
import { imageSizes } from 'src/utils/imageSizes';

const TRANSITION_DURATION = 300;

export interface EntityViewAttributionsImageGalleryProps {
  images: CachedAttributionsFragment[];
}

defineProps<EntityViewAttributionsImageGalleryProps>();
const { t } = useI18n();

const open = ref<number | null>(null);
const transition =
  ref<EntityViewAttributionImageProps['transition']>(undefined);

const transitionTimeout = useTimeout();

function show(id: number | null | undefined, direction: 'right' | 'left') {
  transition.value = `slide-${direction}`;
  open.value = id ?? null;
  transitionTimeout.registerTimeout(() => {
    transition.value = undefined;
  }, TRANSITION_DURATION);
}

onBeforeUnmount(() => {
  transitionTimeout.removeTimeout();
});
</script>
