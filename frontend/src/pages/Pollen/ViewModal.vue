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
      <EntityViewRelatedEntityTable
        entity-key="mother_plants"
        :rows="pollen.mother_plants || []"
        :columns="motherPlantsColumns"
        default-sort-by="name"
      >
        <template #body-cell-name="cellProps">
          <q-td key="name" :props="cellProps">
            <RouterLink
              :to="`/crossings/mother-plants/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.name }}
            </RouterLink>
          </q-td>
        </template>
      </EntityViewRelatedEntityTable>
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
import { graphql } from 'src/graphql';
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
import EntityViewRelatedEntityTable from 'src/components/Entity/View/EntityViewRelatedEntityTable.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Pollen(
      $id: Int!
      $PollenWithCultivar: Boolean = true
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      pollen_by_pk(id: $id) {
        ...pollenFragment
        mother_plants {
          id
          name
          date_impregnated
          created
        }
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

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/crossings/pollen/${props.entityId}/edit`,
    query: route.query,
  });
}

const motherPlantsColumns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: string, b: string) => localizedSortPredicate(a, b),
  },
  {
    name: 'date_impregnated',
    label: t('motherPlants.fields.dateImpregnated'),
    field: 'date_impregnated',
    align: 'left' as const,
    sortable: true,
    format: (val: string | Date | null) => localizeDate(val),
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
