<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="lot"
    sprite-icon="lot"
    :title="lot.display_name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <LotEntityTable :lot="lot" />

      <!-- TODO: related cultivars -->

      <h3 class="q-mb-md">{{ t('attributions.photos') }}</h3>
      <EntityViewAttributionImageGallery
        :images="images"
        :lot="lot"
        :crossing="lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.observations') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OBSERVATION"
        :rows="observations"
        :lot="lot"
        :crossing="lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.treatments') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="TREATMENT"
        :rows="treatments"
        :lot="lot"
        :crossing="lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.samples') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="SAMPLE"
        :rows="samples"
        :lot="lot"
        :crossing="lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.others') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OTHER"
        :rows="other"
        :lot="lot"
        :crossing="lot.crossing"
      />
    </template>

    <template #action-left>
      <LotButtonDelete
        :lot-id="lot.id"
        @deleted="() => router.push({ path: '/lots', query: route.query })"
      />
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import LotButtonDelete from 'src/components/Lot/LotButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import LotEntityTable from 'src/components/Lot/LotEntityTable.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import {
  entityAttributionsViewFragment,
  type EntityAttributionsViewFragment,
} from 'src/components/Entity/entityAttributionsViewFragment';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Lot(
      $id: Int!
      $LotWithOrchard: Boolean! = true
      $LotWithCrossing: Boolean! = true
    ) {
      lots_by_pk(id: $id) {
        ...lotFragment
        cultivars {
          id
          display_name
        }
        attributions_views {
          ...entityAttributionsViewFragment
        }
      }
    }
  `,
  [lotFragment, entityAttributionsViewFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const lot = computed(() => data.value?.lots_by_pk);

const attributions = computed(
  () =>
    (lot.value?.attributions_views || []) as EntityAttributionsViewFragment[],
);
const images = computed(() =>
  attributions.value.filter(
    (row) => row.data_type === 'PHOTO' || row.photo_note,
  ),
);
const observations = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'OBSERVATION'),
);
const treatments = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'TREATMENT'),
);
const samples = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'SAMPLE'),
);
const other = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'OTHER'),
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/lots/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
