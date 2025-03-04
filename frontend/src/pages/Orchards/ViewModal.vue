<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="orchard"
      sprite-icon="orchard"
      :title="orchard.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
          <EntityViewTableRow :label="t('entity.commonColumns.name')">
            {{ orchard.name }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('entity.commonColumns.disabled')">
            {{ orchard.disabled ? '✓' : '' }}
          </EntityViewTableRow>
          <EntityTableViewTimestampRows
            :created="orchard.created"
            :modified="orchard.modified"
          />
        </EntityViewTable>

        <h3 class="q-mb-md">
          {{ t('plantRows.title', 2) }}
        </h3>
        <EntityRelatedTable
          entity-key="plant_rows"
          :rows="orchard.plant_rows || []"
          row-key="id"
          :columns="plantRowsColumns"
          default-sort-by="name"
        >
          <template #body-cell-name="cellProps">
            <q-td key="name" :props="cellProps">
              <RouterLink
                :to="`/rows/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>

        <h3 class="q-mb-md">
          {{ t('lots.title', 2) }}
        </h3>
        <EntityRelatedTable
          entity-key="lots"
          :rows="orchard.lots || []"
          row-key="id"
          :columns="lotsColumns"
          default-sort-by="display_name"
        >
          <template #body-cell-display_name="cellProps">
            <q-td key="display_name" :props="cellProps">
              <RouterLink
                :to="`/lots/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.display_name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>
      </template>

      <template #action-left>
        <OrchardButtonDelete
          v-if="!orchard.disabled"
          :orchard-id="orchard.id"
          @deleted="
            () => router.push({ path: '/orchards', query: route.query })
          "
        />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Orchard(
      $id: Int!
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
        plant_rows(where: { disabled: { _eq: false } }) {
          ...plantRowFragment
        }
        lots {
          ...lotFragment
        }
      }
    }
  `,
  [orchardFragment, plantRowFragment, lotFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['orchards'] },
});

const orchard = computed(() => data.value?.orchards_by_pk);

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/orchards/${props.entityId}/edit`,
    query: route.query,
  });
}

type PlantRow = NonNullable<
  NonNullable<ResultOf<typeof query>['orchards_by_pk']>['plant_rows']
>[0];

const plantRowsColumns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: PlantRow['name'], b: PlantRow['name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'date_created',
    label: t('plantRows.fields.dateCreated'),
    field: 'date_created',
    align: 'left' as const,
    sortable: true,
    format: (v: PlantRow['date_created']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'date_elimitated',
    label: t('plantRows.fields.dateEliminated'),
    field: 'date_elimitated',
    align: 'left' as const,
    sortable: true,
    format: (v: PlantRow['date_eliminated']) => (v ? d(v, 'Ymd') : ''),
  },
];

type Lot = NonNullable<
  NonNullable<ResultOf<typeof query>['orchards_by_pk']>['lots']
>[0];

const lotsColumns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
    sort: (a: Lot['display_name'], b: Lot['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'date_sowed',
    label: t('lots.fields.dateSowed'),
    align: 'left' as const,
    field: 'date_sowed',
    format: (v: Lot['date_sowed']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'date_planted',
    label: t('lots.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    format: (v: Lot['date_planted']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'plot',
    label: t('lots.fields.plot'),
    align: 'left' as const,
    field: 'plot',
    sortable: true,
    sort: (a: Lot['plot'], b: Lot['plot']) =>
      localizedSortPredicate(a || '', b || ''),
  },
];
</script>
