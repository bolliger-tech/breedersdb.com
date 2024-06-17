import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
  const route = useRoute();
  const router = useRouter();

  const pagination = ref({
    sortBy: route.query.sortBy?.toString() || sortBy,
    descending:
      route.query.desc === 'true' || descending || defaults.descending,
    page: parseInt(route.query.page as string, 10) || page || defaults.page,
    rowsPerPage:
      parseInt(route.query.rowsPerPage as string, 10) ||
      rowsPerPage ||
      defaults.rowsPerPage,
    rowsNumber: rowsNumber || defaults.rowsNumber,
  });

  watch(pagination, (value) => {
    const query = {
      ...route.query,
      sortBy: value.sortBy,
      desc: value.descending.toString(),
      page: value.page,
      rowsPerPage: value.rowsPerPage,
    };

    router.replace({ query });
  });

  return {
    pagination,
  };
}
