<template>
  <div class="row items-center justify-between no-wrap">
    <h1 class="q-mr-lg">
      <template v-if="analyzeId !== 'new'">{{ name }}</template>
      <template v-else>{{ t('analyze.header.new') }}</template>
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
      />
      <AnalyzeHeaderMoreMenu
        :analyze-id="analyzeId"
        :saving="saving"
        @rename="showNameDialog = true"
        @duplicate="onDuplicate"
        @deleted="onDeleted"
      />
      <q-btn
        color="primary"
        :title="t('base.close')"
        :loading="saving"
        :disable="saving"
        flat
        icon="close"
        round
        @click="$router.push(pathWithoutId)"
      />
    </div>
  </div>
  <BaseGraphqlError v-if="saveError" :error="saveError" />
  <AnalyzeHeaderNote v-model="note" />
  <AnalyzeHeaderNameDialog
    v-model:show="showNameDialog"
    v-model:name="name"
    :analyze-id="analyzeId"
    :base-table="baseTable"
    @save="save"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import AnalyzeHeaderMoreMenu from './AnalyzeHeaderMoreMenu.vue';
import type { FilterNode } from 'src/components/Analyze/Filter/filterNode';
import { BaseTable } from 'src/components/Analyze/Filter/filterNode';
import { graphql } from 'src/graphql';
import { useMutation } from '@urql/vue';
import type { AnalyzeFiltersFragment } from 'src/components/Analyze/analyzeFiltersFragment';
import { analyzeFiltersFragment } from 'src/components/Analyze/analyzeFiltersFragment';
import { ref, computed, nextTick } from 'vue';
import type { AnalyzeFilterBaseTables } from 'src/graphql';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import AnalyzeHeaderNameDialog from './AnalyzeHeaderNameDialog.vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import AnalyzeHeaderNote from './AnalyzeHeaderNote.vue';
import type { InitialAnalyzeData } from 'src/components/Analyze/AnalyzeView.vue';
import { is } from 'quasar';

export interface AnalyzeHeaderProps {
  analyzeId: 'new' | number;
  name: string;
  note: string | null;
  baseTable: Exclude<BaseTable, BaseTable.Attributions>;
  baseFilter: FilterNode | undefined;
  attributionFilter: FilterNode | undefined;
  visibleColumns: string[] | undefined;
  initialData: InitialAnalyzeData;
}

const props = defineProps<AnalyzeHeaderProps>();

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
  // @ts-expect-error don't move into switch so ts complains if we add a new base table
  throw new Error('Invalid base table');
});

const router = useRouter();
const route = useRoute();

const pathWithoutId = computed(() => route.path.replace(/\/(\d+|new)$/, ''));

const editMutation = graphql(
  `
    mutation EditQuery(
      $id: Int!
      $name: citext!
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
      $name: citext!
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

function getMutationVariables(id: number | undefined = undefined) {
  return {
    ...(id ? { id } : {}),
    name: name.value,
    note: note.value,
    baseTable: baseTable.value,
    baseFilter: filterToPojo(props.baseFilter),
    attributionFilter: filterToPojo(props.attributionFilter),
    visibleColumns: props.visibleColumns || null,
  };
}

const savedData = ref(props.initialData);
const showNameDialog = ref(false);

async function save() {
  if (!name.value) {
    showNameDialog.value = true;
    return;
  }

  let newId: number | undefined = undefined;
  let respData: AnalyzeFiltersFragment | undefined = undefined;

  if (props.analyzeId === 'new') {
    const resp = await executeInsertMutation(getMutationVariables());
    newId = resp.data?.insert_analyze_filters_one?.id;
    respData = resp.data?.insert_analyze_filters_one || undefined;
  } else {
    const resp = await executeEditMutation(
      getMutationVariables(props.analyzeId) as Required<
        ReturnType<typeof getMutationVariables>
      >,
    );
    respData = resp.data?.update_analyze_filters_by_pk || undefined;
  }

  await nextTick();
  if (saveError.value) {
    return;
  }

  saveInsertError.value = undefined;
  saveEditError.value = undefined;

  if (respData) {
    savedData.value = {
      id: respData.id,
      name: respData.name,
      note: respData.note,
      baseFilter: JSON.stringify(respData.base_filter),
      attributionFilter: JSON.stringify(respData.attribution_filter),
      visibleColumns: respData.visible_columns,
    };
  }

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

function isDirty() {
  const current = getMutationVariables();
  const initial = savedData.value;

  // exclude id and baseTable as it can't change
  return !(
    current.name === initial.name &&
    current.note === initial.note &&
    is.deepEqual(
      current.baseFilter,
      JSON.parse(initial.baseFilter || 'null'),
    ) &&
    is.deepEqual(
      current.attributionFilter,
      JSON.parse(initial.attributionFilter || 'null'),
    ) &&
    is.deepEqual(current.visibleColumns, initial.visibleColumns)
  );
}

onBeforeRouteLeave((to, from) => {
  const isDuplication = to.path.endsWith('/new');
  const isInitialSave =
    to.path === from.path.replace(/\/new$/, `/${to.params.analyzeId}`);
  const dirty = isDirty();

  if (!isDuplication && !isInitialSave && dirty) {
    const answer = window.confirm(t('analyze.header.leaveConfirmation'));
    if (!answer) return false;
  }
});

const { t } = useI18n();
</script>
