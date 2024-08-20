<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="lot" sprite-icon="lot" @edit="edit">
    <template #title-text>
      <EntityName :lot="lot" :crossing="lot.crossing" no-link />
    </template>
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <LotEntityTable :lot="lot" />

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

      <h3 class="q-mb-md">{{ t('cultivars.title', 2) }}</h3>
      <EntityViewRelatedEntityTable
        entity-key="cultivars"
        :rows="lot.cultivars || []"
        row-key="id"
        :columns="cultivarsColumns"
        default-sort-by="display_name"
      >
        <template #body-cell-display_name="cellProps">
          <q-td key="display_name" :props="cellProps">
            <RouterLink
              :to="`/cultivars/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.display_name }}
            </RouterLink>
          </q-td>
        </template>
      </EntityViewRelatedEntityTable>
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
import { graphql, ResultOf } from 'src/graphql';
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
import EntityViewRelatedEntityTable from 'src/components/Entity/View/EntityViewRelatedEntityTable.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityName from 'src/components/Entity/EntityName.vue';

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
          created
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

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/lots/${props.entityId}/edit`,
    query: route.query,
  });
}

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

type Cultivars = NonNullable<
  NonNullable<ResultOf<typeof query>['lots_by_pk']>['cultivars']
>[0];

const cultivarsColumns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
    sort: (a: Cultivars['display_name'], b: Cultivars['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    field: 'created',
    align: 'left' as const,
    sortable: true,
    format: (val: string | Date) => d(val, 'ymdHis'),
  },
];
</script>
