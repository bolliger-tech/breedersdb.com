<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="plantGroup"
    sprite-icon="tree-group"
    @edit="edit"
  >
    <template #title-text>
      <EntityName
        :plant-group="plantGroup"
        :cultivar="plantGroup.cultivar"
        :lot="plantGroup.cultivar?.lot"
        :crossing="plantGroup.cultivar?.lot?.crossing"
        no-link
      />
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <PlantGroupEntityTable :plant-group="plantGroup" />

      <h3 class="q-mb-md">{{ t('attributions.photos') }}</h3>
      <EntityViewAttributionImageGallery :images="images" />

      <h3 class="q-mb-md">{{ t('attributions.observations') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OBSERVATION"
        :rows="observations"
        show-entity
      />

      <h3 class="q-mb-md">{{ t('attributions.treatments') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="TREATMENT"
        :rows="treatments"
        show-entity
      />

      <h3 class="q-mb-md">{{ t('attributions.samples') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="SAMPLE"
        :rows="samples"
        show-entity
      />

      <h3 class="q-mb-md">{{ t('attributions.others') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OTHER"
        :rows="other"
        show-entity
      />

      <h3 class="q-mb-md">{{ t('plants.title', 2) }}</h3>
      <EntityViewRelatedEntityTable
        entity-key="plants"
        :rows="plantGroup.plants || []"
        :columns="plantColumns"
        default-sort-by="label_id"
      >
        <template #body-cell-label_id="cellProps">
          <q-td key="label_id" :props="cellProps">
            <RouterLink
              :to="`/plants/${cellProps.row.id}`"
              class="undecorated-link"
            >
              <PlantLabelId :label-id="cellProps.row.label_id" />
            </RouterLink>
          </q-td>
        </template>
        <template #body-cell-plant_row="cellProps">
          <q-td key="plant_row" :props="cellProps">
            <RouterLink
              v-if="cellProps.row.plant_row"
              :to="`/rows/${cellProps.row.plant_row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.plant_row.name }}
            </RouterLink>
          </q-td>
        </template>
        <template #body-cell-orchard="cellProps">
          <q-td key="orchard" :props="cellProps">
            <RouterLink
              v-if="cellProps.row.plant_row?.orchard"
              :to="`/orchards/${cellProps.row.plant_row.orchard.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.plant_row.orchard.name }}
            </RouterLink>
          </q-td>
        </template>
      </EntityViewRelatedEntityTable>
    </template>

    <template #action-left>
      <PlantGroupButtonDelete
        v-if="!plantGroup.disabled"
        :plant-group-id="plantGroup.id"
        @deleted="() => router.push({ path: '/groups', query: route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching || refreshingAttributionsView">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantGroupButtonDelete from 'src/components/PlantGroup/PlantGroupButtonDelete.vue';
import PlantGroupEntityTable from 'src/components/PlantGroup/PlantGroupEntityTable.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import EntityViewRelatedEntityTable from 'src/components/Entity/View/EntityViewRelatedEntityTable.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import {
  entityAttributionsViewFragment,
  type EntityAttributionsViewFragment,
} from 'src/components/Entity/entityAttributionsViewFragment';
import { localizeDate } from 'src/utils/dateUtils';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantGroup(
      $id: Int!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = true
      $PlantWithSegments: Boolean! = false
      $AttributionsViewWithEntites: Boolean! = true
    ) {
      plant_groups_by_pk(id: $id) {
        ...plantGroupFragment
        plants {
          ...plantFragment
        }
        attributions_views {
          ...entityAttributionsViewFragment
        }
      }
    }
  `,
  [plantGroupFragment, plantFragment, entityAttributionsViewFragment],
);

const {
  data,
  error: plantGroupError,
  fetching,
  resume: enablePlantGroupQuery,
} = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  pause: true,
  requestPolicy: 'cache-and-network',
});

const {
  executeMutation: refreshAttributionsView,
  fetching: refreshingAttributionsView,
  error: attributionsRefreshError,
} = useRefreshAttributionsView();
refreshAttributionsView({}).then(() => enablePlantGroupQuery());

const error = computed(
  () => plantGroupError.value || attributionsRefreshError.value,
);
const plantGroup = computed(() => data.value?.plant_groups_by_pk);

const attributions = computed(
  () =>
    (plantGroup.value?.attributions_views ||
      []) as EntityAttributionsViewFragment[],
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
    path: `/groups/${props.entityId}/edit`,
    query: route.query,
  });
}

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

type Plant = NonNullable<
  NonNullable<ResultOf<typeof query>['plant_groups_by_pk']>['plants']
>[0];

const plantColumns = [
  {
    name: 'label_id',
    label: t('plants.fields.labelId'),
    field: 'label_id',
    align: 'left' as const,
    sortable: true,
    sort: (a: Plant['label_id'], b: Plant['label_id']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'plant_row',
    label: t('plantRows.title', 1),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.name,
    sortable: true,
    sort: (a: Plant, b: Plant) =>
      localizedSortPredicate(a.plant_row?.name || '', b.plant_row?.name || ''),
  },
  {
    name: 'distance_plant_row_start',
    label: t('plants.fields.distancePlantRowStart'),
    field: 'distance_plant_row_start',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'orchard',
    label: t('orchards.title', 1),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.orchard?.name,
    sortable: true,
    sort: (a: Plant, b: Plant) =>
      localizedSortPredicate(
        a.plant_row?.orchard?.name || '',
        b.plant_row?.orchard?.name || '',
      ),
  },
  {
    name: 'date_planted',
    label: t('plants.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    format: localizeDate,
    sortable: true,
  },
  {
    name: 'date_eliminated',
    label: t('plants.fields.dateEliminated'),
    align: 'left' as const,
    field: 'date_eliminated',
    format: localizeDate,
    sortable: true,
  },
];
</script>
