<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('attributions.title', 2)"
      :tabs="tabs"
      :search-placeholder="searchPlaceholder"
      :rows="data?.attributions_view || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/attributions"
      :view-entity-path-getter="(id) => `/attributions/${id}`"
    >
      <template #add-button><div></div></template>

      <template #body-cell-entity="cellProps">
        <q-td key="entity" :props="cellProps">
          <EntityLink :entity="cellProps.row" />
        </q-td>
      </template>

      <template #[`body-cell-plant.label_id`]="cellProps">
        <q-td :props="cellProps">
          <EntityLabelId :label-id="cellProps.value" entity-type="plant" />
        </q-td>
      </template>

      <template #body-cell-value="cellProps">
        <q-td key="value" :props="cellProps">
          <AttributionValueChip
            :plant="!!cellProps.row.plant?.id"
            :plant-group="!!cellProps.row.plant_group?.id"
            :cultivar="!!cellProps.row.cultivar?.id"
            :lot="!!cellProps.row.lot?.id"
            max-width="clamp(300px, 30svw, 600px)"
            class="vertical-middle"
          >
            <template v-if="cellProps.row.data_type === 'PHOTO'">
              <EntityViewAttributionImage
                :file-name="cellProps.row.text_value"
                :attribution="cellProps.row"
                button-size="xs"
              />
            </template>
            <template v-else>{{ cellProps.value }}</template>
          </AttributionValueChip>
        </q-td>
      </template>

      <template #body-cell-photo_note="cellProps">
        <q-td key="photo_note" :props="cellProps">
          <EntityViewAttributionImage
            v-if="cellProps.row.photo_note"
            :file-name="cellProps.row.photo_note"
            :attribution="cellProps.row"
          />
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import { graphql } from 'src/graphql';
import { computed, UnwrapRef, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import {
  attributionsViewFragment,
  type AttributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { localizeDate } from 'src/utils/dateUtils';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import { AttributeDataTypes } from 'src/graphql';
import EntityLink from 'src/components/Entity/EntityLink.vue';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';

const { t } = useI18n();

const query = graphql(
  `
    query AttributionsView(
      $limit: Int!
      $offset: Int!
      $orderBy: [attributions_view_order_by!]
      $where: attributions_view_bool_exp
      $AttributionsViewWithEntites: Boolean = true
    ) {
      attributions_view_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      attributions_view(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...attributionsViewFragment
      }
    }
  `,
  [attributionsViewFragment],
);

const { queryArg: subset } = useQueryArg<
  'plants' | 'plantGroups' | 'cultivars' | 'lots' | 'all'
>({
  key: 'tab',
  defaultValue: 'all',
  replace: true,
});
const tabs: { value: UnwrapRef<typeof subset>; label: string }[] = [
  { value: 'all', label: t('entity.tabs.all') },
  {
    value: 'plants',
    label: t('plants.title', 2),
  },
  {
    value: 'plantGroups',
    label: t('plantGroups.title', 2),
  },
  {
    value: 'cultivars',
    label: t('cultivars.title', 2),
  },
  {
    value: 'lots',
    label: t('lots.title', 2),
  },
];

const searchColumns = computed(() => {
  if (subset.value === 'all') {
    return ['attribute_name'];
  } else if (subset.value === 'plants') {
    return ['attribute_name', 'plant.label_id', 'plant_group.display_name'];
  } else if (subset.value === 'plantGroups') {
    return ['attribute_name', 'plant_group.display_name'];
  } else if (subset.value === 'cultivars') {
    return ['attribute_name', 'cultivar.display_name'];
  } else if (subset.value === 'lots') {
    return ['attribute_name', 'lot.display_name'];
  }
  throw new Error('Invalid subset');
});

const {
  search,
  pagination,
  variables: _variables,
} = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'created',
  searchColumns: searchColumns,
});

const variables = computed(() => {
  const where = { _and: [_variables.value.where] };
  if (subset.value === 'plants') {
    where._and.push({ plant_id: { _is_null: false } });
  } else if (subset.value === 'plantGroups') {
    where._and.push({ plant_group_id: { _is_null: false } });
  } else if (subset.value === 'cultivars') {
    where._and.push({ cultivar_id: { _is_null: false } });
  } else if (subset.value === 'lots') {
    where._and.push({ lot_id: { _is_null: false } });
  }

  return {
    ..._variables.value,
    where,
  };
});

const { data, fetching, error } = await useRefreshAttributionsViewThenQuery({
  query,
  variables,
  context: { additionalTypenames: ['attributions_view'] },
});

const attributionsCount = computed(
  () => data.value?.attributions_view_aggregate?.aggregate?.count || 0,
);

const columns = computed(() => [
  ...(subset.value === 'all'
    ? [
        {
          name: 'entity',
          label: t('attributions.columns.entity'),
          field: (row: AttributionsViewFragment) => row,
          align: 'left' as const,
          sortable: false,
        },
      ]
    : []),
  ...(subset.value === 'plants'
    ? [
        {
          name: 'plant.label_id',
          label: t('plants.fields.labelId'),
          align: 'left' as const,
          field: (row: AttributionsViewFragment) => row.plant?.label_id,
          sortable: true,
        },
        {
          name: 'plant_group.display_name',
          label: t('plants.fields.groupName'),
          align: 'left' as const,
          field: (row: AttributionsViewFragment) =>
            row.plant_group?.display_name,
          sortable: true,
        },
      ]
    : []),
  ...(subset.value === 'plantGroups'
    ? [
        {
          name: 'plant_group.display_name',
          label: t('entity.commonColumns.displayName'),
          align: 'left' as const,
          field: (row: AttributionsViewFragment) =>
            row.plant_group?.display_name,
          sortable: true,
        },
      ]
    : []),
  ...(subset.value === 'cultivars'
    ? [
        {
          name: 'cultivar.display_name',
          label: t('entity.commonColumns.displayName'),
          align: 'left' as const,
          field: (row: AttributionsViewFragment) => row.cultivar?.display_name,
          sortable: true,
        },
      ]
    : []),
  ...(subset.value === 'lots'
    ? [
        {
          name: 'lot.display_name',
          label: t('entity.commonColumns.displayName'),
          align: 'left' as const,
          field: (row: AttributionsViewFragment) => row.lot?.display_name,
          sortable: true,
        },
      ]
    : []),
  {
    name: 'attribute_name',
    label: t('attributions.columns.attributeName'),
    field: 'attribute_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'value',
    label: t('attributions.columns.value'),
    field: (row: AttributionsViewFragment) => getValue(row),
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'text_note',
    label: t('attributions.columns.textNote'),
    field: 'text_note',
    align: 'left' as const,
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  {
    name: 'photo_note',
    label: t('attributions.columns.photoNote'),
    field: 'photo_note',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'date_attributed',
    label: t('attributions.columns.dateAttributed'),
    field: 'date_attributed',
    align: 'left' as const,
    sortable: true,
    format: (v: AttributionsViewFragment['date_attributed']) =>
      localizeDate(v) || '',
  },
  {
    name: 'author',
    label: t('attributions.columns.author'),
    field: 'author',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'exceptional_attribution',
    label: t('attributions.columns.exceptionalAttribution'),
    field: 'exceptional_attribution',
    align: 'left' as const,
    sortable: true,
    format: (val: boolean) => (val ? '✓' : ''),
  },
  ...useTimestampColumns(),
]);

const { visibleColumns } = useEntityTableColumns({
  entityType: 'attributions',
  defaultColumns: columns.value.map((column) => column.name),
});

watch(
  error,
  (newValue) => {
    if (newValue) {
      throw newValue;
    }
  },
  { immediate: true },
);

watch(
  attributionsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

function getValue(row: AttributionsViewFragment) {
  const type = dataTypeToColumnTypes(row.data_type as AttributeDataTypes);
  const value = getAttributionValue(row);

  if (type === ColumnTypes.Photo) {
    // photo is handled in the template
    return '';
  }

  return formatResultColumnValue({ value, type });
}

const searchPlaceholder = computed(() => {
  if (subset.value === 'all') {
    return t('attributions.searchPlaceholder.all');
  } else if (subset.value === 'plants') {
    return t('attributions.searchPlaceholder.plants');
  } else if (subset.value === 'plantGroups') {
    return t('attributions.searchPlaceholder.plantGroups');
  } else if (subset.value === 'cultivars') {
    return t('attributions.searchPlaceholder.cultivars');
  } else if (subset.value === 'lots') {
    return t('attributions.searchPlaceholder.lots');
  }
  throw new Error('Invalid subset');
});
</script>
