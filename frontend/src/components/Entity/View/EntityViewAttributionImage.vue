<template>
  <img
    v-if="preview"
    v-ripple
    :src="`/api/assets/images/${desiredFileName}?file=${storedFileName}&height=200`"
    :srcset="`
      /api/assets/images/${desiredFileName}?file=${storedFileName}&height=200,
      /api/assets/images/${desiredFileName}?file=${storedFileName}&height=400 2x
    `"
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

  <q-dialog
    v-model="open"
    :transition-show="transition"
    :transition-hide="transition"
    :transition-duration="transitionDuration"
    @keydown.left="$emit('previous')"
    @keydown.right="$emit('next')"
  >
    <q-card
      v-touch-swipe.right="() => $emit('previous')"
      v-touch-swipe.left="() => $emit('next')"
      style="max-width: calc(100svw - 48px); max-height: calc(100svh - 48px)"
    >
      <q-card-section class="row justify-end q-pa-sm">
        <q-btn flat dense round icon="close" @click="open = false" />
      </q-card-section>
      <q-card-section>
        <q-img
          :src="`/api/assets/images/${desiredFileName}?file=${storedFileName}&width=1024`"
          :srcset="`
            /api/assets/images/${desiredFileName}?file=${storedFileName}&width=320 320w,
            /api/assets/images/${desiredFileName}?file=${storedFileName}&width=768 768w,
            /api/assets/images/${desiredFileName}?file=${storedFileName}&width=1024 1024w,
            /api/assets/images/${desiredFileName}?file=${storedFileName}&width=2560 2560w,
            /api/assets/images/${desiredFileName}?file=${storedFileName}&width=3840 3840w,
          `"
          spinner-color="primary"
          fit="contain"
          style="
            max-width: calc(100svw - 80px);
            width: calc(100svw - 80px);
            max-height: calc(100svh - 202px);
            height: calc(100svh - 202px);
          "
          :draggable="false"
        >
          <template #error>
            <div class="text-caption q-mx-md absolute-center text-center">
              <q-icon name="warning" size="sm" class="q-mr-sm" />{{
                t('entity.failedToLoadImage')
              }}<br />{{ storedFileName }}
            </div>
          </template>
        </q-img>
        <p class="text-caption q-ma-none text-center">
          <span v-if="attribution.note">{{ attribution.note }}</span
          >&nbsp;
          <span class="text-muted">{{ metadata }}</span>
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <a
          :href="`/api/assets/images/${desiredFileName}?file=${storedFileName}`"
          download
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
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { EntityAttributionsViewFragment } from '../entityAttributionsViewFragment';
import { localizeDate } from 'src/utils/dateUtils';
import { QDialogProps } from 'quasar';

export interface EntityViewAttributionImageProps {
  attribution: EntityAttributionsViewFragment;
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
  preview?: boolean;
  transition?: QDialogProps['transitionShow'];
  transitionDuration?: number;
}

const props = defineProps<EntityViewAttributionImageProps>();
defineEmits<{
  next: [];
  previous: [];
}>();

const open = defineModel<boolean>({ required: false, default: false });

const { t } = useI18n();

const entityName = computed(() => {
  return (
    props.plant?.label_id ??
    props.plantGroup?.display_name ??
    props.cultivar?.display_name ??
    props.lot?.display_name ??
    props.crossing?.name ??
    'unknown'
  );
});

const entityType = computed(() => {
  return props.plant
    ? t('plants.title', 1)
    : props.plantGroup
      ? t('plantGroups.title', 1)
      : props.cultivar
        ? t('cultivars.title', 1)
        : props.lot
          ? t('lots.title', 1)
          : props.crossing
            ? t('crossings.title', 1)
            : 'unknown';
});

const desiredFileName = computed(() => {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;

  return encodeURIComponent(
    `${org}-${entityName.value}-${props.attribution.attribute_name}-${props.attribution.date_attributed}-${props.attribution.id}.jpg`,
  );
});

const storedFileName = computed(() => {
  return props.attribution.text_value;
});

const metadata = computed(() => {
  return `${props.attribution.attribute_name}, ${localizeDate(props.attribution.date_attributed)} ${props.attribution.author}, ${entityType.value} ${entityName.value}`;
});
</script>
