<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="orchard"
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
          {{ orchard.disabled ? t('base.yes') : t('base.no') }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(orchard.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            orchard.modified
              ? localizeDate(orchard.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>

      <h3 class="q-mb-md">
        {{ t('plantRows.title', 2) }}
      </h3>
      <q-table
        v-if="orchard.plant_rows"
        class="q-mt-md"
        flat
        dense
        :rows="orchard.plant_rows"
        :columns="plantRowsColumns"
        :rows-per-page-options="[0]"
        hide-pagination
        wrap-cells
        binary-state-sort
      >
        <template #body-cell-plant_group="cellProps">
          <q-td key="value" :props="cellProps">
            <RouterLink
              :to="`/rows/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.name }}
            </RouterLink>
          </q-td>
        </template>
      </q-table>
    </template>

    <template #action-left>
      <OrchardButtonDelete
        :orchard-id="orchard.id"
        @deleted="() => router.push({ path: '/orchards', query: route.query })"
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Orchard(
      $id: Int!
      $withPlantRows: Boolean = true
      $withPlants: Boolean = false
    ) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const orchard = computed(() => data.value?.orchards_by_pk);

const { t } = useI18n();
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
    name: 'plant_group',
    label: t('entity.commonColumns.name'),
    field: 'plant_group',
    align: 'left' as const,
    sortable: true,
    sort: (a: PlantRow, b: PlantRow) => localizedSortPredicate(a.name, b.name),
  },
];
</script>
