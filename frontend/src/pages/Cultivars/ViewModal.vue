<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="cultivar"
    sprite-icon="cultivar"
    :title="cultivar.display_name"
    @edit="edit"
  >
    <template #title-text>
      <EntityName
        :cultivar="cultivar"
        :lot="cultivar.lot"
        :crossing="cultivar.lot?.crossing"
        no-link
      />
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <CultivarEntityTable :cultivar="cultivar" />

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

      <h3 class="q-mb-md">{{ t('plantGroups.title', 2) }}</h3>
      <EntityViewRelatedEntityTable
        entity-key="plantGroupss"
        :rows="cultivar.plant_groups || []"
        row-key="id"
        :columns="plantGroupColumns"
        default-sort-by="display_name"
      >
        <template #body-cell-display_name="cellProps">
          <q-td key="display_name" :props="cellProps">
            <RouterLink
              :to="`/groups/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.display_name }}
            </RouterLink>
          </q-td>
        </template>
      </EntityViewRelatedEntityTable>
    </template>

    <template #action-left>
      <CultivarButtonDelete
        :cultivar-id="cultivar.id"
        @deleted="() => router.push({ path: '/cultivars', query: route.query })"
      />
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
import CultivarButtonDelete from 'src/components/Cultivar/CultivarButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql, ResultOf } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import CultivarEntityTable from 'src/components/Cultivar/CultivarEntityTable.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import {
  entityAttributionsViewFragment,
  type EntityAttributionsViewFragment,
} from 'src/components/Entity/entityAttributionsViewFragment';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityViewRelatedEntityTable from 'src/components/Entity/View/EntityViewRelatedEntityTable.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Cultivar(
      $id: Int!
      $CultivarWithLot: Boolean = true
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = true
      $PlantGroupWithCultivar: Boolean! = false
      $AttributionsViewWithEntites: Boolean! = true
    ) {
      cultivars_by_pk(id: $id) {
        ...cultivarFragment
        plant_groups {
          ...plantGroupFragment
        }
        attributions_views {
          ...entityAttributionsViewFragment
        }
      }
    }
  `,
  [cultivarFragment, plantGroupFragment, entityAttributionsViewFragment],
);

const {
  data,
  error: cultivarError,
  fetching,
  resume: enableCultivarQuery,
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
refreshAttributionsView({}).then(() => enableCultivarQuery());

const error = computed(
  () => cultivarError.value || attributionsRefreshError.value,
);

const cultivar = computed(() => data.value?.cultivars_by_pk);

const attributions = computed(
  () =>
    (cultivar.value?.attributions_views ||
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

const { t, d } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/cultivars/${props.entityId}/edit`,
    query: route.query,
  });
}

type PlantGroup = NonNullable<
  NonNullable<ResultOf<typeof query>['cultivars_by_pk']>['plant_groups']
>[0];

const { localizedSortPredicate } = useLocalizedSort();

const plantGroupColumns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
    sort: (a: PlantGroup['display_name'], b: PlantGroup['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'label_id',
    label: t('plantGroups.fields.labelId'),
    align: 'left' as const,
    field: 'label_id',
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: PlantGroup) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: PlantGroup) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];
</script>
