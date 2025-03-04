<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent v-if="lot" sprite-icon="lot" @edit="edit">
      <template #title-text>
        <EntityName :lot="lot" :crossing="lot.crossing" no-link />
      </template>
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <LotEntityTable :lot="lot" />

        <EntityViewAllAttributions :attributions="attributions" show-entity />

        <h3 class="q-mb-md">{{ t('cultivars.title', 2) }}</h3>
        <EntityRelatedTable
          entity-key="cultivars"
          :rows="lot.cultivars || []"
          row-key="id"
          :columns="cultivarsColumns"
          default-sort-by="display_name"
        >
          <template #body-cell-display_name="cellProps">
            <q-td key="display_name" :props="cellProps">
              <RouterLink
                :to="`/cultivars/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.display_name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>
      </template>

      <template #action-left>
        <LotButtonDelete
          :lot-id="lot.id"
          @deleted="() => router.push({ path: '/lots', query: route.query })"
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import LotButtonDelete from 'src/components/Lot/LotButtonDelete.vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import LotEntityTable from 'src/components/Lot/LotEntityTable.vue';
import {
  attributionsViewFragment,
  type AttributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityName from 'src/components/Entity/EntityName.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Lot(
      $id: Int!
      $LotWithOrchard: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $AttributionsViewWithEntites: Boolean! = true
    ) {
      lots_by_pk(id: $id) {
        ...lotFragment
        cultivars {
          id
          display_name
          created
        }
        attributions_views {
          ...attributionsViewFragment
        }
      }
    }
  `,
  [lotFragment, attributionsViewFragment],
);

const { data, error, fetching } = await useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const lot = computed(() => data.value?.lots_by_pk);

const attributions = computed(
  () => (lot.value?.attributions_views || []) as AttributionsViewFragment[],
);

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/lots/${props.entityId}/edit`,
    query: route.query,
  });
}

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

type Cultivars = NonNullable<
  NonNullable<ResultOf<typeof query>['lots_by_pk']>['cultivars']
>[0];

const cultivarsColumns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
    sort: (a: Cultivars['display_name'], b: Cultivars['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    field: 'created',
    align: 'left' as const,
    sortable: true,
    format: (val: string) => d(val, 'YmdHis'),
  },
];
</script>
