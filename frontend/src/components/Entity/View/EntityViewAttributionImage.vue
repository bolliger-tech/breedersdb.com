<template>
  <div v-if="preview" class="relative-position" style="line-height: 0">
    <img
      ref="previewRef"
      v-ripple
      :src="imgUrls['1x']"
      :srcset="`${imgUrls['1x']}, ${imgUrls['2x']} 2x`"
      class="cursor-pointer"
      :class="{ invisible: !previewIsReady }"
      loading="lazy"
      @click="open = true"
      @load="previewIsReady = true"
      @onerror="previewIsReady = true"
    />
    <div
      v-if="!previewIsReady"
      :style="`height: ${previewHeight || DEFAULT_PREVIEW_HEIGHT}px; width: ${previewWidth || DEFAULT_PREVIEW_HEIGHT}px;`"
    >
      <div class="absolute-center">
        <q-spinner size="3em" color="primary" />
      </div>
    </div>
  </div>
  <q-btn
    v-else
    flat
    dense
    icon="photo"
    padding="none"
    :round="false"
    :size="buttonSize || 'sm'"
    color="primary"
    :label="t('base.show')"
    @click.stop="open = true"
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
          :src="imgUrls['1024w']"
          :srcset="`${imgUrls['320w']} 320w, ${imgUrls['768w']} 768w, ${imgUrls['1024w']} 1024w, ${imgUrls['2560w']} 2560w, ${imgUrls['3840w']} 3840w`"
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
        <a :href="imgUrls.full" download>
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
import type { AttributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { QBtnProps, QDialogProps } from 'quasar';
import {
  dataTypeToColumnTypes,
  formatResultColumnValue,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { captureException } from '@sentry/browser';
import { getImageFileName, getImageUrlRelative } from 'src/utils/imageUtils';

const DEFAULT_PREVIEW_HEIGHT = 200;

export interface EntityViewAttributionImageProps {
  fileName: string;
  attribution: AttributionsViewFragment;
  preview?: boolean;
  previewWidth?: number;
  previewHeight?: number;
  transition?: QDialogProps['transitionShow'];
  transitionDuration?: number;
  buttonSize?: QBtnProps['size'];
}

const props = defineProps<EntityViewAttributionImageProps>();
defineEmits<{
  next: [];
  previous: [];
}>();

const open = defineModel<boolean>({ required: false, default: false });

const { t, d, n } = useI18n();

const entityName = computed(() => {
  const name =
    props.attribution.plant?.label_id ??
    props.attribution.plant_group?.display_name ??
    props.attribution.cultivar?.display_name ??
    props.attribution.lot?.display_name;

  if (!name) {
    // report but don't fail
    const error = new Error(
      'No entity name found for attribution. Consider using the `attributionsViewFragment` with `$AttributionsViewWithEntites = true`.',
    );
    console.error(error.message, error.stack);
    captureException(error);
  }

  return name || 'unknown';
});

const entityTypeName = computed(() => {
  return props.attribution.plant
    ? t('plants.title', 1)
    : props.attribution.plant_group
      ? t('plantGroups.title', 1)
      : props.attribution.cultivar
        ? t('cultivars.title', 1)
        : props.attribution.lot
          ? t('lots.title', 1)
          : 'unknown';
});

const metadata = computed(() => {
  const attribute =
    props.attribution.data_type === 'PHOTO'
      ? `${props.attribution.attribute_name}, `
      : '';
  return `${attribute}${d(props.attribution.date_attributed, 'Ymd')} ${props.attribution.author}, ${entityTypeName.value} ${entityName.value}`;
});

const description = computed(() => {
  const type = dataTypeToColumnTypes(props.attribution.data_type);

  if (type === ColumnTypes.Photo) {
    return {
      primary: props.attribution.text_note,
      additional: '',
    };
  }

  const value = getAttributionValue(props.attribution);
  const formattedValue = formatResultColumnValue({ value, type, d, n });

  return {
    primary: `${props.attribution.attribute_name}: ${formattedValue}`,
    additional: props.attribution.text_note,
  };
});

const desiredFileName = computed(() =>
  getImageFileName({
    entityName: entityName.value,
    attributeName: props.attribution.attribute_name,
    dateAttributed: props.attribution.date_attributed,
    attributionId: props.attribution.id,
  }),
);

const imgUrls = computed(() => {
  return {
    '1x': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: props.previewWidth,
      maxHeight: props.previewHeight || DEFAULT_PREVIEW_HEIGHT,
    }),
    '2x': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: props.previewWidth ? 2 * props.previewWidth : undefined,
      maxHeight: 2 * (props.previewHeight || DEFAULT_PREVIEW_HEIGHT),
    }),
    '320w': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: 320,
    }),
    '768w': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: 768,
    }),
    '1024w': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: 1024,
    }),
    '2560w': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: 2560,
    }),
    '3840w': getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
      maxWidth: 3840,
    }),
    full: getImageUrlRelative({
      serverFileName: props.fileName,
      desiredFileName: desiredFileName.value,
    }),
  };
});

const previewIsReady = ref(false);
</script>
