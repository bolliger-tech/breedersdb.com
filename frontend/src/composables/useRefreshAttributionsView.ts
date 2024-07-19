import { useMutation } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';

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
