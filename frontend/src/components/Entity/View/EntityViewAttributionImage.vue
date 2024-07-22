<template>
  <img
    v-if="preview"
    v-ripple
    :src="`/api/assets/images/${desiredFileName}?file=${fileName}&${previewDimensions['1x']}`"
    :srcset="`
      /api/assets/images/${desiredFileName}?file=${fileName}&${previewDimensions['1x']},
      /api/assets/images/${desiredFileName}?file=${fileName}&${previewDimensions['2x']} 2x
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
          :src="`/api/assets/images/${desiredFileName}?file=${fileName}&width=1024`"
          :srcset="`
            /api/assets/images/${desiredFileName}?file=${fileName}&width=320 320w,
            /api/assets/images/${desiredFileName}?file=${fileName}&width=768 768w,
            /api/assets/images/${desiredFileName}?file=${fileName}&width=1024 1024w,
            /api/assets/images/${desiredFileName}?file=${fileName}&width=2560 2560w,
            /api/assets/images/${desiredFileName}?file=${fileName}&width=3840 3840w,
          `"
          spinner-color="primary"
          fit="contain"
          style="
            max-width: calc(100svw - 80px);
            width: calc(100svw - 80px);
            max-height: calc(100svh - 222px);
            height: calc(100svh - 222px);
          "
          :draggable="false"
        >
          <template #error>
            <div class="absolute-center column align-center">
              <BaseMessage
                type="warning"
                :message="t('entity.failedToLoadImage')"
              />
              <p class="q-ma-none text-caption">{{ fileName }}</p>
            </div>
          </template>
        </q-img>
        <p class="text-caption q-ma-none text-center">
          <span>{{ description.primary }}</span>
          <span
            v-if="description.primary && description.additional"
            class="text-muted"
          >
            –
          </span>
          <span class="text-muted">{{ description.additional }}</span>
          <br />
          <span class="text-muted">{{ metadata }}</span>
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <a
          :href="`/api/assets/images/${desiredFileName}?file=${fileName}`"
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
import {
  dataTypeToColumnTypes,
  formatResultColumnValue,
  getAttributeValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

const DEFAULT_PREVIEW_HEIGHT = 200;

export interface EntityViewAttributionImageProps {
  fileName: string;
  attribution: EntityAttributionsViewFragment;
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
  preview?: boolean;
  previewWidth?: number;
  previewHeight?: number;
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

const metadata = computed(() => {
  const attribute =
    props.attribution.data_type === 'PHOTO'
      ? `${props.attribution.attribute_name}, `
      : '';
  return `${attribute}${localizeDate(props.attribution.date_attributed)} ${props.attribution.author}, ${entityType.value} ${entityName.value}`;
});

const description = computed(() => {
  const type = dataTypeToColumnTypes(props.attribution.data_type);

  if (type === ColumnTypes.Photo) {
    return {
      primary: props.attribution.text_note,
      additional: '',
    };
  }

  const value = getAttributeValue(props.attribution);
  const formattedValue = formatResultColumnValue({ value, type });

  return {
    primary: `${props.attribution.attribute_name}: ${formattedValue}`,
    additional: props.attribution.text_note,
  };
});

const previewDimensions = computed(() => {
  const dims1x = [];
  const dims2x = [];

  if (props.previewWidth) {
    dims1x.push(`width=${props.previewWidth}`);
    dims2x.push(`width=${2 * props.previewWidth}`);
  }

  if (props.previewHeight || DEFAULT_PREVIEW_HEIGHT) {
    dims1x.push(`height=${props.previewHeight || DEFAULT_PREVIEW_HEIGHT}`);
    dims2x.push(
      `height=${2 * (props.previewHeight || DEFAULT_PREVIEW_HEIGHT)}`,
    );
  }

  return {
    '1x': dims1x.join('&'),
    '2x': dims2x.join('&'),
  };
});
</script>
