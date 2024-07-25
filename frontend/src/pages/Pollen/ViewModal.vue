<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="pollen"
    sprite-icon="male"
    :title="pollen.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.name')">
          {{ pollen.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('pollen.fields.dateHarvested')">
          {{ localizeDate(pollen.date_harvested) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(pollen.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            pollen.modified
              ? localizeDate(pollen.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
        <EntityViewTableRow v-if="pollen.note">
          <strong>{{ t('entity.commonColumns.note') }}</strong>
          <br />
          <span style="white-space: pre-line">{{ pollen.note }}</span>
        </EntityViewTableRow>
      </EntityViewTable>

      <h3 class="q-mb-md">
        {{ t('motherPlants.title', 2) }}
      </h3>
      <q-table
        v-if="pollen.mother_plants"
        class="q-mt-md"
        flat
        dense
        :rows="pollen.mother_plants"
        :columns="motherPlantsColumns"
        :rows-per-page-options="[0]"
        hide-pagination
        wrap-cells
        binary-state-sort
      >
        <template #body-cell-plant_group="cellProps">
          <q-td key="value" :props="cellProps">
            <RouterLink
              :to="`/crossings/mother-plants/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.name }}
            </RouterLink>
          </q-td>
        </template>
      </q-table>
      <template v-else> {{ t('base.noData') }} </template>
    </template>

    <template #action-left>
      <PollenButtonDelete
        :pollen-id="pollen.id"
        @deleted="
          () => router.push({ path: '/crossings/pollen', query: route.query })
        "
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
import PollenButtonDelete from 'src/components/Pollen/PollenButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Pollen(
      $id: Int!
      $withCultivar: Boolean = true
      $withMotherPlants: Boolean = false
    ) {
      pollen_by_pk(id: $id) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const pollen = computed(() => data.value?.pollen_by_pk);

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/crossings/pollen/${props.entityId}/edit`,
    query: route.query,
  });
}

type MotherPlant = NonNullable<
  NonNullable<ResultOf<typeof query>['pollen_by_pk']>['mother_plants']
>[0];

const motherPlantsColumns = [
  {
    name: 'mother_plant',
    label: t('entity.commonColumns.name'),
    field: 'mother_plant',
    align: 'left' as const,
    sortable: true,
    sort: (a: MotherPlant, b: MotherPlant) =>
      localizedSortPredicate(a.name, b.name),
  },
];
</script>
