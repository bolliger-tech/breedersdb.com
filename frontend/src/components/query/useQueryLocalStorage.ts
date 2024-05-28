import { useQueryStore } from 'src/components/Query/useQueryStore';
import { computed } from 'vue';
import { LocalStorage } from 'quasar';

export default function useQueryLocalStorage() {
  const store = useQueryStore();
  const baseTable = computed(() => store.baseTable);

  const visibleColumnsKey = computed(
    () => `query_visible_columns--${baseTable.value}`,
  );
  function setVisibleColumns(visibleColumns: string[]) {
    LocalStorage.set(visibleColumnsKey.value, visibleColumns);
  }
  function getVisibleColumns(defaultValue: string[] = []): string[] {
    return LocalStorage.getItem(visibleColumnsKey.value) || defaultValue;
  }

  const showRowsWithoutAttributionsKey = computed(
    () => `query_show_rows_without_attributions--${baseTable.value}`,
  );
  function setShowRowsWithoutAttributions(show: boolean) {
    LocalStorage.set(showRowsWithoutAttributionsKey.value, show);
  }
  function getShowRowsWithoutattributions(defaultValue: boolean): boolean {
    return (
      LocalStorage.getItem(showRowsWithoutAttributionsKey.value) || defaultValue
    );
  }

  const explainKey = computed(() => `query_explain--${baseTable.value}`);
  function setExplain(explain: boolean) {
    LocalStorage.set(explainKey.value, explain);
  }
  function getExplain(defaultValue: boolean): boolean {
    console.log(
      'getExplain',
      explainKey.value,
      LocalStorage.getItem(explainKey.value),
    );
    return LocalStorage.getItem(explainKey.value) || defaultValue;
  }

  return {
    setExplain,
    getExplain,
    setVisibleColumns,
    getVisibleColumns,
    setShowRowsWithoutAttributions,
    getShowRowsWithoutattributions,
  };
}
