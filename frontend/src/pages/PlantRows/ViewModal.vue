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
          <RouterLink
            :to="`/orchards/${plantRow.orchard.id}`"
            class="undecorated-link"
          >
            {{ plantRow.orchard.name }}
          </RouterLink>
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
      <EntityViewRelatedEntityTable
        entity-key="plants"
        :rows="plantRow.plants || []"
        :columns="plantsColumns"
        default-sort-by="label_id"
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
      </EntityViewRelatedEntityTable>
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
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import EntityViewRelatedEntityTable from 'src/components/Entity/View/EntityViewRelatedEntityTable.vue';
import { plantGroupSegmentsFragment } from 'src/components/PlantGroup/plantGroupFragment';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
        plants(where: { disabled: { _eq: false } }) {
          id
          label_id
          plant_group {
            ...plantGroupSegmentsFragment
          }
        }
      }
    }
  `,
  [plantRowFragment, plantGroupSegmentsFragment],
);

const { data, error, fetching } = useQuery({
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
    label: t('plants.fields.labelId'),
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
