import { defineStore } from 'pinia';
import { FilterNode, BaseTable } from './Filter/filterNode';
import { LocalStorage } from 'quasar';
import { computed, ref } from 'vue';

export const useQueryStore = defineStore('query', () => {
  const baseFilter = ref<FilterNode | undefined>();
  const attributionFilter = ref<FilterNode | undefined>();

  const baseTable = computed(
    () => baseFilter.value?.getBaseTable() || BaseTable.Cultivars,
  );

  const filterDragNode = ref<FilterNode | undefined>(undefined);

  const _explainKey = computed(() => `query_explain--${baseTable.value}`);
  const _explain = ref<boolean>(
    LocalStorage.getItem(_explainKey.value) ?? true,
  );
  const explain = computed({
    get: () => _explain.value,
    set: (value: boolean) => {
      _explain.value = value;
      LocalStorage.set(_explainKey.value, value);
    },
  });

  return {
    baseFilter,
    baseTable,
    attributionFilter,
    filterDragNode,
    explain,
  };
});

// export const useQueryStore = defineStore('query', {
//   state: (): QueryState => ({
//     _BaseTable: _BaseTable.Cultivars,
//     baseFilter: defaultBaseFilter,
//     attributionFilter: defaultAttributionFilter,
//     filterDragNode: undefined,
//     explain: useQueryLocalStorage().getExplain(false),

//     visibleColumns: useQueryLocalStorage().getVisibleColumns(),
//     showRowsWithoutAttributions:
//       useQueryLocalStorage().getShowRowsWithoutattributions(true),

//     queryGroups: [],
//     queryGroup: null,
//     queryCode: '',
//     queryDescription: '',
//     attemptedToSaveQuery: false,
//   }),

//   getters: {
//     attributionsAvailable(state) {
//       const s = state as QueryState;
//       return (
//         s._BaseTable === _BaseTable.Lots ||
//         s._BaseTable === _BaseTable.Cultivars ||
//         s._BaseTable === _BaseTable.Trees
//       );
//     },

//     getVisibleColumns(state) {
//       const columns = (state as QueryState).visibleColumns;
//       const _BaseTable = (state as QueryState)._BaseTable;
//       const attributionsAvailable = this.attributionsAvailable;

//       return columns.filter((col: string): boolean => {
//         if (col.startsWith(`${_BaseTable}View.`)) {
//           return true;
//         }

//         return attributionsAvailable && col.startsWith('Attribution.');
//       });
//     },

//     hasVisibleAttributionColumns(): boolean {
//       return (
//         this.getVisibleColumns.find((col: string): boolean =>
//           col.startsWith('Attribution.'),
//         ) !== undefined
//       );
//     },

//     rowsWithAttributionsOnly(state) {
//       if (!this.attributionsAvailable || !this.hasVisibleAttributionColumns) {
//         return false;
//       }

//       return !(state as QueryState).showRowsWithoutAttributions;
//     },
//   },

//   actions: {
//     async maybeLoadQueryGroups() {
//       if (!this.queryGroups.length) {
//         await this.forceLoadQueryGroups();
//       }
//     },

//     async forceLoadQueryGroups() {
//       console.log('loading query groups');
//       // await useApi()
//       //   .get<QueryGroup[]>('query-groups')
//       //   .then((data) => (this.queryGroups = data as QueryGroup[]));
//     },

//     setBaseFilter(filter: FilterNode) {
//       // use object assign to maintain reactivity
//       Object.assign(this.baseFilter, filter);
//     },

//     setAttributionFilter(filter: FilterNode) {
//       // use object assign to maintain reactivity
//       Object.assign(this.attributionFilter, filter);
//     },

//     setVisibleColumns(columns: string[]) {
//       this.visibleColumns = columns;
//       useQueryLocalStorage().setVisibleColumns(columns);
//     },

//     setShowRowsWithoutAttributions(show: boolean) {
//       this.showRowsWithoutAttributions = show;
//       useQueryLocalStorage().setShowRowsWithoutAttributions(show);
//     },

//     setExplain(explain: boolean) {
//       this.explain = explain;
//       useQueryLocalStorage().setExplain(explain);
//     },

//     async setQueryGroupById(id: number) {
//       await this.maybeLoadQueryGroups();
//       const candidates = this.queryGroups.filter(
//         (item: QueryGroup) => item.id === id,
//       );
//       if (!candidates.length) {
//         this.queryGroup = this.queryGroups[0];
//       }
//       this.queryGroup = candidates[0];
//     },
//   },
// });
