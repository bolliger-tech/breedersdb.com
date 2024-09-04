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

      <EntityViewAllAttributions :attributions="attributions" show-entity />

      <h3 class="q-mb-md">{{ t('plantGroups.title', 2) }}</h3>
      <EntityRelatedTable
        entity-key="plantGroups"
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
      </EntityRelatedTable>

      <h3 class="q-mb-md">{{ t('plants.title', 2) }}</h3>
      <PlantList
        :rows="plants"
        :visible-columns="[
          'label_id',
          'plant_group_name',
          'plant_row',
          'distance_plant_row_start',
          'orchard',
          'date_planted',
          'date_eliminated',
        ]"
      />
    </template>

    <template #action-left>
      <CultivarButtonDelete
        :cultivar-id="cultivar.id"
        @deleted="() => router.push({ path: '/cultivars', query: route.query })"
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
  attributionsViewFragment,
  type AttributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantList from 'src/components/Plant/PlantList.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Cultivar(
      $id: Int!
      $CultivarWithLot: Boolean = true
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = true
      $PlantGroupWithCultivar: Boolean! = false
      $PlantWithSegments: Boolean! = true
      $AttributionsViewWithEntites: Boolean! = true
    ) {
      cultivars_by_pk(id: $id) {
        ...cultivarFragment
        plant_groups {
          ...plantGroupFragment
          plants {
            ...plantFragment
          }
        }
        attributions_views {
          ...attributionsViewFragment
        }
      }
    }
  `,
  [
    cultivarFragment,
    plantGroupFragment,
    attributionsViewFragment,
    plantFragment,
  ],
);

const { data, error, fetching } = await useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const cultivar = computed(() => data.value?.cultivars_by_pk);

const attributions = computed(
  () =>
    (cultivar.value?.attributions_views || []) as AttributionsViewFragment[],
);

const plants = computed(
  () => cultivar.value?.plant_groups.flatMap((pg) => pg.plants) || [],
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
    sort: (a: PlantGroup['label_id'], b: PlantGroup['label_id']) =>
      localizedSortPredicate(a || '', b || ''),
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: PlantGroup) => d(row.created, 'YmdHis'),
    sortable: true,
  },
];
</script>
