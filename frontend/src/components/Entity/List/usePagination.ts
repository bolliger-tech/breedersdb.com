import { useQueryArg } from 'src/composables/useQueryArg';
import { ref, watch } from 'vue';

const defaults = {
  descending: false,
  page: 1,
  rowsPerPage: 100,
  rowsNumber: 0,
};

export function usePagination({
  sortBy,
  descending = defaults.descending,
  page = defaults.page,
  rowsPerPage = defaults.rowsPerPage,
  rowsNumber = defaults.rowsNumber,
}: {
  sortBy: string;
  descending?: boolean;
  page?: number;
  rowsPerPage?: number;
  rowsNumber?: number;
}) {
  const { queryArg: sortByArg } = useQueryArg({
    key: 'sortBy',
    defaultValue: sortBy,
    replace: true,
  });
  const { queryArg: descendingArg } = useQueryArg({
    key: 'desc',
    defaultValue: descending,
    replace: true,
  });
  const { queryArg: pageArg } = useQueryArg({
    key: 'page',
    defaultValue: page,
    replace: true,
  });
  const { queryArg: rowsPerPageArg } = useQueryArg({
    key: 'rowsPerPage',
    defaultValue: rowsPerPage,
    replace: true,
  });

  const pagination = ref({
    sortBy: sortByArg.value,
    descending: descendingArg.value,
    page: pageArg.value,
    rowsPerPage: rowsPerPageArg.value,
    rowsNumber: rowsNumber || defaults.rowsNumber,
  });

  watch([sortByArg, descendingArg, pageArg, rowsPerPageArg], () => {
    pagination.value = {
      sortBy: sortByArg.value,
      descending: descendingArg.value,
      page: pageArg.value,
      rowsPerPage: rowsPerPageArg.value,
      rowsNumber: pagination.value.rowsNumber,
    };
  });

  watch(
    pagination,
    (newValue) => {
      sortByArg.value = newValue.sortBy;
      descendingArg.value = newValue.descending;
      pageArg.value = newValue.page;
      rowsPerPageArg.value = newValue.rowsPerPage;
    },
    { immediate: true },
  );

  return {
    pagination,
  };
}
