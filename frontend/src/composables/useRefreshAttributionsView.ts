import { useMutation, useQuery, type UseQueryArgs } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';
import { computed } from 'vue';

export type RefreshAttributionsViewResult = ResultOf<typeof mutation>;

const mutation = graphql(`
  mutation RefreshAttributionsView {
    refresh_attributions_view(
      where: { view_name: { _eq: "attributions_view" } }
      order_by: { last_check: desc }
      limit: 1
    ) {
      id
      view_name
      last_change
      last_check
    }
  }
`);

export function useRefreshAttributionsView() {
  return useMutation(mutation);
}

export function useRefreshAttributionsViewThenQuery<T>(
  queryArgs: Omit<UseQueryArgs<T>, 'pause'>,
) {
  const query = useQuery<T>({
    requestPolicy: 'cache-and-network',
    ...queryArgs,
    variables: queryArgs.variables,
    pause: true,
  });

  const {
    executeMutation: refreshAttributionsView,
    fetching: refreshingAttributionsView,
    error: attributionsRefreshError,
  } = useRefreshAttributionsView();

  refreshAttributionsView({}).then(() => query.resume());

  const fetching = computed(
    () => query.fetching.value || refreshingAttributionsView.value,
  );

  const error = computed(
    () => query.error.value || attributionsRefreshError.value,
  );

  return {
    ...query,
    fetching,
    error,
  };
}
