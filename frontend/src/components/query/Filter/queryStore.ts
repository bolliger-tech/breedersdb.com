import { defineStore } from 'pinia';
import { BaseTable, FilterDragNode } from './query';
import { FilterNode } from './filterNode';
import { FilterOperand, FilterType } from './filterTypes';
import { Attribute } from './form';
// import useApi from 'src/composables/api';
import useQueryLocalStorageHelper from './useQueryLocalStorageHelper';
import { FilterOptionSchemas, PropertySchema } from './filterOptionSchema';
import { QueryGroup } from './queryGroup';

const localStorageHelper = useQueryLocalStorageHelper();

const defaultBaseFilter = FilterNode.FilterRoot(
  FilterOperand.And,
  FilterType.Base,
);
const defaultMarkFilter = FilterNode.FilterRoot(
  FilterOperand.And,
  FilterType.Mark,
);

export interface QueryState {
  baseTable: BaseTable;
  baseFilter: FilterNode;
  markFilter: FilterNode;
  filterDragNode: FilterDragNode;
  attributes: Attribute[];
  filterOptionSchemas: FilterOptionSchemas | undefined;
  visibleColumns: string[];
  showRowsWithoutattributions: boolean;
  queryGroups: QueryGroup[];
  queryGroup: QueryGroup | null;
  queryCode: string;
  queryDescription: string;
  attemptedToSaveQuery: boolean;
}

export type QueryStore = ReturnType<typeof useQueryStore>;

export const useQueryStore = defineStore('query', {
  state: (): QueryState => ({
    baseTable: localStorageHelper.getBaseTable(BaseTable.Cultivars),
    baseFilter: localStorageHelper.getBaseFilter(defaultBaseFilter), // use getters and actions
    markFilter: localStorageHelper.getMarkFilter(defaultMarkFilter), // use getters and actions
    filterDragNode: false,
    attributes: [],
    filterOptionSchemas: undefined,
    visibleColumns: localStorageHelper.getVisibleColumns(),
    showRowsWithoutattributions:
      localStorageHelper.getShowRowsWithoutattributions(true),
    queryGroups: [],
    queryGroup: null,
    queryCode: '',
    queryDescription: '',
    attemptedToSaveQuery: false,
  }),

  getters: {
    attributionsAvailable(state) {
      const s = state as QueryState;
      return (
        s.baseTable === BaseTable.Lots ||
        s.baseTable === BaseTable.Cultivars ||
        s.baseTable === BaseTable.Trees
      );
    },

    markPropertySchema(state) {
      const s = state as QueryState;
      return s.attributes.map(
        (s) => s,
        // attributeConverter.toPropertySchema,
      );
    },

    baseFilterOptions(state) {
      const s = state as QueryState;
      if (!s.filterOptionSchemas || !s.baseFilter) {
        return [];
      }

      const options: PropertySchema[] =
        [...s.filterOptionSchemas[s.baseTable]] || [];

      if (this.attributionsAvailable) {
        // options.push(...this.markPropertySchema);
      }

      return options;
    },

    markFilterOptions(state) {
      const s = state as QueryState;
      if (!s.filterOptionSchemas) {
        return [];
      }

      return s.filterOptionSchemas['attributions'] || [];
    },

    getBaseFilter(state) {
      if (!this.baseFilterOptions) {
        return defaultBaseFilter;
      }

      return (state as QueryState).baseFilter;
    },

    getMarkFilter(state) {
      if (!this.markFilterOptions) {
        return defaultMarkFilter;
      }

      return (state as QueryState).markFilter;
    },

    getVisibleColumns(state) {
      const columns = (state as QueryState).visibleColumns;
      const baseTable = (state as QueryState).baseTable;
      const attributionsAvailable = this.attributionsAvailable;

      return columns.filter((col: string): boolean => {
        if (col.startsWith(`${baseTable}View.`)) {
          return true;
        }

        return attributionsAvailable && col.startsWith('Mark.');
      });
    },

    hasVisibleMarkColumns(): boolean {
      // noinspection JSIncompatibleTypesComparison
      return (
        this.getVisibleColumns.find((col: string): boolean =>
          col.startsWith('Mark.'),
        ) !== undefined
      );
    },

    rowsWithattributionsOnly(state) {
      if (!this.attributionsAvailable || !this.hasVisibleMarkColumns) {
        return false;
      }

      return !(state as QueryState).showRowsWithoutattributions;
    },
  },

  actions: {
    async maybeLoadAttributes() {
      if (!this.attributes.length) {
        console.log('loading mark form properties');
        // await useApi()
        //   .get<Attribute[]>('mark-form-properties')
        //   .then(
        //     (data) => (this.attributes = data as Attribute[]),
        //   );
      }
    },

    async maybeLoadFilterOptionSchemas() {
      if (undefined === this.filterOptionSchemas) {
        console.log('loading filter option schemas');
        // await useApi()
        //   .get<FilterOptionSchemas>('queries/get-filter-schemas')
        //   .then(
        //     (data) => (this.filterOptionSchemas = data as FilterOptionSchemas),
        //   );
      }
    },

    async maybeLoadQueryGroups() {
      if (!this.queryGroups.length) {
        await this.forceLoadQueryGroups();
      }
    },

    async forceLoadQueryGroups() {
      console.log('loading query groups');
      // await useApi()
      //   .get<QueryGroup[]>('query-groups')
      //   .then((data) => (this.queryGroups = data as QueryGroup[]));
    },

    async ensureSchemasLoaded() {
      const base = this.maybeLoadFilterOptionSchemas();
      const mark = this.maybeLoadAttributes();

      await Promise.all([base, mark]);
    },

    setBaseFilter(filter: FilterNode) {
      // use object assign to maintain reactivity
      Object.assign(this.baseFilter, filter);
    },

    setMarkFilter(filter: FilterNode) {
      // use object assign to maintain reactivity
      Object.assign(this.markFilter, filter);
    },

    setVisibleColumns(columns: string[]) {
      this.visibleColumns = columns;
      localStorageHelper.setVisibleColumns(columns);
    },

    setShowRowsWithoutattributions(show: boolean) {
      this.showRowsWithoutattributions = show;
      localStorageHelper.setShowRowsWithoutattributions(show);
    },

    async setQueryGroupById(id: number) {
      await this.maybeLoadQueryGroups();
      const candidates = this.queryGroups.filter(
        (item: QueryGroup) => item.id === id,
      );
      if (!candidates.length) {
        this.queryGroup = this.queryGroups[0];
      }
      this.queryGroup = candidates[0];
    },
  },
});
