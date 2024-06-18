import { useQueryArg } from 'src/composables/useQueryArg';
import { onMounted, ref, watch } from 'vue';

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

  function setQueryArgs(_pagination: typeof pagination.value) {
    sortByArg.value = _pagination.sortBy;
    descendingArg.value = _pagination.descending;
    pageArg.value = _pagination.page;
    rowsPerPageArg.value = _pagination.rowsPerPage;
  }

  watch(pagination, setQueryArgs);
  onMounted(() => setQueryArgs(pagination.value));

  return {
    pagination,
  };
}
