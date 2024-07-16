<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="plantRow"
    sprite-icon="rows"
    :title="plantRow.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.name')">
          {{ plantRow.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('plantRows.fields.orchard')">
          {{ plantRow.orchard.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.dateDisabled')">
          {{ localizeDate(plantRow.date_eliminated) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(plantRow.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            plantRow.modified
              ? localizeDate(plantRow.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>

      <h3 class="q-mb-md">
        {{ t('plants.title', 2) }}
      </h3>
      <q-table
        v-if="plantRow.plants"
        class="q-mt-md"
        flat
        dense
        :rows="plantRow.plants"
        :columns="plantsColumns"
        :rows-per-page-options="[0]"
        hide-pagination
        wrap-cells
        binary-state-sort
      >
        <template #body-cell-label_id="cellProps">
          <q-td key="value" :props="cellProps">
            <RouterLink
              :to="`/plants/${cellProps.row.id}`"
              class="undecorated-link"
            >
              <PlantLabelId :label-id="cellProps.row.label_id" />
            </RouterLink>
          </q-td>
        </template>
        <template #body-cell-plant_group="cellProps">
          <q-td key="value" :props="cellProps">
            <EntityName
              :plant-group="cellProps.row.plant_group"
              :cultivar="cellProps.row.plant_group?.cultivar"
              :lot="cellProps.row.plant_group?.cultivar.lot"
              :crossing="cellProps.row.plant_group?.cultivar.lot.crossing"
            />
          </q-td>
        </template>
      </q-table>
    </template>

    <template #action-left>
      <PlantRowButtonDelete
        v-if="!plantRow.disabled"
        :plant-row-id="plantRow.id"
        @deleted="() => router.push({ path: '/rows', query: route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!, $withPlants: Boolean = true) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plantRow = computed(() => data.value?.plant_rows_by_pk);

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/rows/${props.entityId}/edit`,
    query: route.query,
  });
}

type Plant = NonNullable<
  NonNullable<ResultOf<typeof query>['plant_rows_by_pk']>['plants']
>[0];

const plantsColumns = [
  {
    name: 'label_id',
    label: t('entity.commonColumns.name'),
    field: 'label_id',
    align: 'left' as const,
    sortable: true,
    sort: (a: Plant['label_id'], b: Plant['label_id']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'plant_group',
    label: t('plants.fields.plantGroup'),
    field: 'plant_group',
    align: 'left' as const,
    sortable: true,
    sort: (a: Plant['plant_group'], b: Plant['plant_group']) =>
      localizedSortPredicate(a.display_name, b.display_name),
  },
];
</script>
