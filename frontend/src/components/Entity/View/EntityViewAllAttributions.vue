<template>
  <h3 class="q-mb-md">{{ t('attributions.photos') }}</h3>
  <EntityViewAttributionImageGallery :images="images" />

  <h3 class="q-mb-md">{{ t('attributions.observations') }}</h3>
  <EntityViewAttributionsTable
    attribute-type="OBSERVATION"
    :rows="observations"
    :show-entity="showEntity"
  />

  <h3 class="q-mb-md">{{ t('attributions.treatments') }}</h3>
  <EntityViewAttributionsTable
    attribute-type="TREATMENT"
    :rows="treatments"
    :show-entity="showEntity"
  />

  <h3 class="q-mb-md">{{ t('attributions.samples') }}</h3>
  <EntityViewAttributionsTable
    attribute-type="SAMPLE"
    :rows="samples"
    :show-entity="showEntity"
  />

  <h3 class="q-mb-md">{{ t('attributions.others') }}</h3>
  <EntityViewAttributionsTable
    attribute-type="OTHER"
    :rows="other"
    :show-entity="showEntity"
  />
</template>

<script setup lang="ts">
import { type EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';

export interface EntityViewAllAttributionsProps {
  attributions: EntityAttributionsViewFragment[];
  showEntity?: boolean;
}

const props = defineProps<EntityViewAllAttributionsProps>();

const images = computed(() =>
  props.attributions.filter((a) => a.data_type === 'PHOTO' || a.photo_note),
);
const observations = computed(() =>
  props.attributions.filter((a) => a.attribute_type === 'OBSERVATION'),
);
const treatments = computed(() =>
  props.attributions.filter((a) => a.attribute_type === 'TREATMENT'),
);
const samples = computed(() =>
  props.attributions.filter((a) => a.attribute_type === 'SAMPLE'),
);
const other = computed(() =>
  props.attributions.filter((a) => a.attribute_type === 'OTHER'),
);

const { t } = useI18n();
</script>
