import { useMutation, useQuery, type UseQueryArgs } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';
import { computed } from 'vue';

export type RefreshAttributionsViewResult = ResultOf<typeof mutation>;

const mutation = graphql(`
  mutation RefreshAttributionsView {
    refresh_attributions_view(
      where: { view_name: { _eq: "attributions_view" } }
      limit: 1
    ) {
      id
      view_name
      last_refresh
    }
  }
`);

export function useRefreshAttributionsView() {
  return useMutation(mutation);
}

export async function useRefreshAttributionsViewThenQuery<T>(
  queryArgs: Omit<UseQueryArgs<T>, 'pause'>,
) {
  const query = useQuery<T>({
    requestPolicy: 'cache-and-network',
    ...queryArgs,
    variables: queryArgs.variables,
    pause: true,
  });

  const {
    fetching: refreshingAttributionsView,
    error: attributionsRefreshError,
    ...urql
  } = useRefreshAttributionsView();

  await urql.executeMutation({}).then(() => query.resume());

  const fetching = computed(
    () => query.fetching.value || refreshingAttributionsView.value,
  );

  const error = computed(
    () => query.error.value || attributionsRefreshError.value,
  );

  const queryData = await query;

  return {
    ...queryData,
    fetching,
    error,
  };
}
