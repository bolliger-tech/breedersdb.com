import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';

export function useRefreshAttributionsView() {
  return useMutation(
    graphql(`
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
    `),
  );
}
