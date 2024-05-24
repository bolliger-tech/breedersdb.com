import { defineStore } from 'pinia';
import { BaseTable, FilterDragNode } from './Filter/queryTypes';
import { FilterNode, FilterConjunction, FilterType } from './Filter/filterNode';
import { Attribute } from './Filter/formTypes';
import useQueryLocalStorageHelper from './Filter/useQueryLocalStorageHelper';
import { QueryGroup } from './Filter/queryGroupTypes';

const localStorageHelper = useQueryLocalStorageHelper();

const defaultBaseFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  filterType: FilterType.Base,
});
const defaultAttributionFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  filterType: FilterType.Attribution,
});

export interface QueryState {
  baseTable: BaseTable;
  baseFilter: FilterNode;
  attributionFilter: FilterNode;
  filterDragNode: FilterDragNode;
  attributes: Attribute[];
  visibleColumns: string[];
  showRowsWithoutattributions: boolean;
  queryGroups: QueryGroup[];
  queryGroup: QueryGroup | null;
  queryCode: string;
  queryDescription: string;
  attemptedToSaveQuery: boolean;
  explain: boolean;
}

export type QueryStore = ReturnType<typeof useQueryStore>;

export const useQueryStore = defineStore('query', {
  state: (): QueryState => ({
    baseTable: localStorageHelper.getBaseTable(BaseTable.Cultivars),
    baseFilter: localStorageHelper.getBaseFilter(defaultBaseFilter), // use getters and actions
    attributionFilter: localStorageHelper.getAttributionFilter(
      defaultAttributionFilter,
    ), // use getters and actions
    filterDragNode: false,
    attributes: [],
    // filterOptionSchemas: undefined,
    visibleColumns: localStorageHelper.getVisibleColumns(),
    showRowsWithoutattributions:
      localStorageHelper.getShowRowsWithoutattributions(true),
    queryGroups: [],
    queryGroup: null,
    queryCode: '',
    queryDescription: '',
    attemptedToSaveQuery: false,
    explain: false, // TODO: get from local storage
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

    // attributionAttributeSchema(state) {
    //   const s = state as QueryState;
    //   return s.attributes.map(
    //     (s) => s,
    //     // attributeConverter.toAttributeSchema,
    //   );
    // },

    // baseTableColumns(state) {
    //   const s = state as QueryState;
    //   if (!s.filterOptionSchemas || !s.baseFilter) {
    //     return [];
    //   }

    //   const options: AttributeSchema[] =
    //     [...s.filterOptionSchemas[s.baseTable]] || [];

    //   if (this.attributionsAvailable) {
    //     // options.push(...this.attributionAttributeSchema);
    //   }

    //   return options;
    // },

    // attributionFilterOptions(state) {
    //   const s = state as QueryState;
    //   if (!s.filterOptionSchemas) {
    //     return [];
    //   }

    //   return s.filterOptionSchemas['attributions'] || [];
    // },

    getBaseFilter(state) {
      // if (!this.baseTableColumns) {
      //   return defaultBaseFilter;
      // }

      return (state as QueryState).baseFilter;
    },

    getAttributionFilter(state) {
      // if (!this.attributionFilterOptions) {
      //   return defaultAttributionFilter;
      // }

      return (state as QueryState).attributionFilter;
    },

    getVisibleColumns(state) {
      const columns = (state as QueryState).visibleColumns;
      const baseTable = (state as QueryState).baseTable;
      const attributionsAvailable = this.attributionsAvailable;

      return columns.filter((col: string): boolean => {
        if (col.startsWith(`${baseTable}View.`)) {
          return true;
        }

        return attributionsAvailable && col.startsWith('Attribution.');
      });
    },

    hasVisibleAttributionColumns(): boolean {
      // noinspection JSIncompatibleTypesComparison
      return (
        this.getVisibleColumns.find((col: string): boolean =>
          col.startsWith('Attribution.'),
        ) !== undefined
      );
    },

    rowsWithattributionsOnly(state) {
      if (!this.attributionsAvailable || !this.hasVisibleAttributionColumns) {
        return false;
      }

      return !(state as QueryState).showRowsWithoutattributions;
    },
  },

  actions: {
    async maybeLoadAttributes() {
      if (!this.attributes.length) {
        console.log('loading attribution form properties');
        // await useApi()
        //   .get<Attribute[]>('attribution-form-properties')
        //   .then(
        //     (data) => (this.attributes = data as Attribute[]),
        //   );
      }
    },

    async maybeLoadFilterOptionSchemas() {
      // if (undefined === this.filterOptionSchemas) {
      //   console.log('loading filter option schemas');
      // await useApi()
      //   .get<FilterOptionSchemas>('queries/get-filter-schemas')
      //   .then(
      //     (data) => (this.filterOptionSchemas = data as FilterOptionSchemas),
      //   );
      // }
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
      const attribution = this.maybeLoadAttributes();

      await Promise.all([base, attribution]);
    },

    setBaseFilter(filter: FilterNode) {
      // use object assign to maintain reactivity
      Object.assign(this.baseFilter, filter);
    },

    setAttributionFilter(filter: FilterNode) {
      // use object assign to maintain reactivity
      Object.assign(this.attributionFilter, filter);
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
