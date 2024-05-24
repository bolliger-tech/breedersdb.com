import { useQueryStore } from './queryStore';
import { BaseTable } from './queryTypes';
import { FilterNode } from './filterNode';

function setVisibleColumns(visibleColumns: string[]) {
  window.localStorage.setItem(
    getVisibleColumnsKey(),
    JSON.stringify(visibleColumns),
  );
}

function getVisibleColumns(defaultValue: string[] = []): string[] {
  const encoded = window.localStorage.getItem(getVisibleColumnsKey());

  return encoded ? (JSON.parse(encoded) as string[]) : defaultValue;
}

function getVisibleColumnsKey() {
  const baseTableName = useQueryStore().baseTable;
  return `breedersdb_query_visible_columns--${baseTableName}`;
}

function setBaseTable(baseTableName: BaseTable) {
  window.localStorage.setItem(getBaseTableKey(), baseTableName);
}

function getBaseTable(defaultValue: BaseTable): BaseTable {
  return (
    (window.localStorage.getItem(getBaseTableKey()) as BaseTable) ||
    defaultValue
  );
}

function getBaseTableKey() {
  return 'breedersdb_query_base_table';
}

function setBaseFilter(filter: FilterNode) {
  window.localStorage.setItem(getBaseFilterKey(), JSON.stringify(filter));
}

function getBaseFilter(defaultValue: FilterNode): FilterNode {
  // TODO:
  // const encoded = window.localStorage.getItem(getBaseFilterKey());

  // return encoded ? FilterNode.FromJSON(encoded) : defaultValue;
  return defaultValue;
}

function getBaseFilterKey() {
  const baseTableName = useQueryStore().baseTable;
  return `breedersdb_query_base_filter--${baseTableName}`;
}

function setAttributionFilter(filter: FilterNode) {
  window.localStorage.setItem(
    getAttributionFilterKey(),
    JSON.stringify(filter),
  );
}

function getAttributionFilter(defaultValue: FilterNode): FilterNode {
  // TODO:
  // const encoded = window.localStorage.getItem(getAttributionFilterKey());

  // return encoded ? FilterNode.FromJSON(encoded) : defaultValue;
  return defaultValue;
}

function getAttributionFilterKey() {
  const baseTableName = useQueryStore().baseTable;
  return `breedersdb_query_attribution_filter--${baseTableName}`;
}

function setShowRowsWithoutattributions(show: boolean) {
  window.localStorage.setItem(
    getShowRowsWithoutattributionsKey(),
    JSON.stringify(show),
  );
}

function getShowRowsWithoutattributions(defaultValue: boolean): boolean {
  const encoded = window.localStorage.getItem(
    getShowRowsWithoutattributionsKey(),
  );

  // noinspection JSIncompatibleTypesComparison
  if (null === encoded) {
    return defaultValue;
  }

  return JSON.parse(encoded) as boolean;
}

function getShowRowsWithoutattributionsKey() {
  return 'breedersdb_query_show_rows_without_attributions';
}

export default function useQueryLocalStorageHelper() {
  return {
    setVisibleColumns,
    getVisibleColumns,
    setBaseTable,
    getBaseTable,
    setBaseFilter,
    getBaseFilter,
    setAttributionFilter,
    getAttributionFilter,
    setShowRowsWithoutattributions,
    getShowRowsWithoutattributions,
  };
}
