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

  <q-dialog v-model="open">
    <q-card
      style="width: clamp(300px, calc(90vw - 20px), 980px); max-width: unset"
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
          `"
          sizes="clamp(300px, calc(90vw - 20px), 980px)"
          spinner-color="white"
          fit="contain"
          style="
            max-width: clamp(300px, calc(90vw - 52px), 980px);
            max-height: calc(90vh - 200px);
          "
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

const desiredFileName = computed(() => {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const entityName =
    props.plant?.label_id ??
    props.plantGroup?.display_name ??
    props.cultivar?.display_name ??
    props.lot?.display_name ??
    props.crossing?.name ??
    'unknown';

  return encodeURIComponent(
    `${org}-${entityName}-${props.attribution.attribute_name}-${props.attribution.date_attributed}-${props.attribution.id}.jpg`,
  );
});

const storedFileName = computed(() => {
  return props.attribution.text_value;
});

const metadata = computed(() => {
  return `${props.attribution.attribute_name}, ${props.attribution.date_attributed} ${props.attribution.author}`;
});
</script>
