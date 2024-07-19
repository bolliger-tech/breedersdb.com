<template>
  <div class="row items-center justify-between no-wrap">
    <h1 class="q-mr-lg">
      <template v-if="analyzeId !== 'new'">{{ name }}</template>
      <template v-else>{{ t('analyze.header.title') }}</template>
    </h1>
    <div class="row no-wrap justify-center content-center">
      <q-btn
        color="primary"
        :title="t('base.save')"
        :loading="saving"
        :disable="saving"
        flat
        icon="save"
        round
        @click="save"
      >
      </q-btn>
      <QueryHeaderMoreMenu
        :analyze-id="analyzeId"
        :saving="saving"
        @rename="showNameDialog = true"
        @duplicate="onDuplicate"
        @deleted="onDeleted"
      />
    </div>
  </div>
  <BaseGraphqlError v-if="saveError" :error="saveError" />
  <QueryHeaderNote v-model="note" />
  <QueryHeaderNameDialog
    v-model:show="showNameDialog"
    v-model:name="name"
    :analyze-id="analyzeId"
    :base-table="baseTable"
    @save="save"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryHeaderMoreMenu from './QueryHeaderMoreMenu.vue';
import {
  BaseTable,
  FilterNode,
} from 'src/components/Analyze/Filter/filterNode';
import { graphql } from 'src/graphql';
import { useMutation } from '@urql/vue';
import { analyzeFiltersFragment } from 'src/components/Analyze/analyzeFiltersFragment';
import { ref, computed, nextTick } from 'vue';
import { AnalyzeFilterBaseTables } from 'src/graphql';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import QueryHeaderNameDialog from './QueryHeaderNameDialog.vue';
import { useRouter, useRoute } from 'vue-router';
import QueryHeaderNote from './QueryHeaderNote.vue';

export interface QueryHeaderProps {
  analyzeId: 'new' | number;
  name: string;
  note: string | null;
  baseTable: Exclude<BaseTable, BaseTable.Attributions>;
  baseFilter: FilterNode | undefined;
  attributionFilter: FilterNode | undefined;
  visibleColumns: string[] | undefined;
}

const props = defineProps<QueryHeaderProps>();

const name = ref(props.name);
const note = ref(props.note);

const baseTable = computed<AnalyzeFilterBaseTables>(() => {
  switch (props.baseTable) {
    case BaseTable.Cultivars:
      return 'CULTIVARS';
    case BaseTable.Crossings:
      return 'CROSSINGS';
    case BaseTable.Lots:
      return 'LOTS';
    case BaseTable.PlantGroups:
      return 'PLANT_GROUPS';
    case BaseTable.Plants:
      return 'PLANTS';
  }
  // keep ts happy
  throw new Error('Invalid base table');
});

const router = useRouter();
const route = useRoute();

const pathWithoutId = computed(() => route.path.replace(/\/(\d+|new)$/, ''));

const editMutation = graphql(
  `
    mutation EditQuery(
      $id: Int!
      $name: String!
      $note: String
      $baseTable: analyze_filter_base_tables_enum!
      $baseFilter: jsonb
      $attributionFilter: jsonb
      $visibleColumns: [String!]
    ) {
      update_analyze_filters_by_pk(
        pk_columns: { id: $id }
        _set: {
          name: $name
          note: $note
          base_table: $baseTable
          base_filter: $baseFilter
          attribution_filter: $attributionFilter
          visible_columns: $visibleColumns
        }
      ) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

const insertMutation = graphql(
  `
    mutation InsertQuery(
      $name: String!
      $note: String
      $baseTable: analyze_filter_base_tables_enum!
      $baseFilter: jsonb
      $attributionFilter: jsonb
      $visibleColumns: [String!]
    ) {
      insert_analyze_filters_one(
        object: {
          name: $name
          note: $note
          base_table: $baseTable
          base_filter: $baseFilter
          attribution_filter: $attributionFilter
          visible_columns: $visibleColumns
        }
      ) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

function filterToPojo(filter: FilterNode | undefined) {
  return filter ? JSON.parse(JSON.stringify(filter)) : null;
}

const showNameDialog = ref(false);

async function save() {
  if (!name.value) {
    showNameDialog.value = true;
    return;
  }

  const variables = {
    name: name.value,
    note: note.value,
    baseTable: baseTable.value,
    baseFilter: filterToPojo(props.baseFilter),
    attributionFilter: filterToPojo(props.attributionFilter),
    visibleColumns: props.visibleColumns || null,
  };

  let newId: number | undefined = undefined;

  if (props.analyzeId === 'new') {
    const resp = await executeInsertMutation(variables);
    newId = resp.data?.insert_analyze_filters_one?.id;
  } else {
    await executeEditMutation({
      id: props.analyzeId,
      ...variables,
    });
  }

  await nextTick();
  if (saveError.value) {
    return;
  }

  saveInsertError.value = undefined;
  saveEditError.value = undefined;

  if (props.analyzeId === 'new') {
    if (newId) {
      router.replace({
        path: `${pathWithoutId.value}/${newId.toString()}`,
        query: route.query,
      });
    }
  }
}

const saving = computed(() => savingInsert.value || savingEdit.value);
const saveError = computed(() => saveInsertError.value || saveEditError.value);

function onDeleted() {
  router.push({
    path: pathWithoutId.value,
  });
}

function onDuplicate() {
  name.value = '';
  router.push({
    path: `${pathWithoutId.value}/new`,
    query: route.query,
  });
}

const { t } = useI18n();
</script>
