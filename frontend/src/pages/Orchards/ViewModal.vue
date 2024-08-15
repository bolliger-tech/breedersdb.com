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
          {{ orchard.disabled ? '✓' : '' }}
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
      <EntityViewRelatedEntityTable
        entity-key="plant_rows"
        :rows="orchard.plant_rows || []"
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
      </EntityViewRelatedEntityTable>
    </template>

    <template #action-left>
      <OrchardButtonDelete
        :orchard-id="orchard.id"
        @deleted="() => router.push({ path: '/orchards', query: route.query })"
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
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
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
    query Orchard($id: Int!) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
        plant_rows(where: { disabled: { _eq: false } }) {
          ...plantRowFragment
        }
      }
    }
  `,
  [orchardFragment, plantRowFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
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

const plantRowsColumns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: string, b: string) => localizedSortPredicate(a, b),
  },
  {
    name: 'date_elimitated',
    label: t('plantRows.fields.dateEliminated'),
    field: 'date_elimitated',
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
