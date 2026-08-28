import { useClientHandle, type OperationResult } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, onScopeDispose, ref, type Ref } from 'vue';

type TableName = string;

export function useIsUnique({
  tableName,
  existingId,
  columnName = 'name',
  additionalWhere,
}: {
  tableName: TableName;
  existingId?: number | undefined;
  columnName?: string;
  additionalWhere?: Ref<Record<string, unknown>>;
}) {
  const query = graphql(`
    query UniqueQueryFor_${tableName}($where: ${tableName}_bool_exp!) {
      ${tableName}(where: $where, limit: 1) {
        id
      }
    }
  `);

  const { client } = useClientHandle();

  // Checks overlap: the debounced input rule may still be running when the
  // user hits save and the form validates again. Count them so the input's
  // spinner only stops once the last one is done.
  const running = ref(0);
  const fetching = computed(() => running.value > 0);

  // Closing the modal mid-check must tear the query down. Without this the
  // operation stays subscribed for an answer nobody awaits, and the retry
  // exchange (see src/boot/graphql-client.ts) keeps retrying it.
  const inFlight = new Set<() => void>();
  onScopeDispose(() => {
    inFlight.forEach((cancel) => cancel());
    inFlight.clear();
  });

  async function isUnique(newName: string) {
    running.value++;
    let cancel: (() => void) | undefined;
    try {
      // A one-shot query per call. Sharing urql's reactive query state (as
      // useQuery does) would let a later call orphan the promise of an
      // earlier one and hand it the wrong result. Subscribing by hand rather
      // than via toPromise() keeps the teardown handle; the stale / hasNext
      // filter is what toPromise() applies internally.
      const result = await new Promise<OperationResult | null>((resolve) => {
        const subscription = client
          .query(
            query,
            {
              where: {
                [columnName]: { _eq: newName },
                ...additionalWhere?.value,
              },
            },
            { requestPolicy: 'cache-and-network' },
          )
          .subscribe((operationResult) => {
            if (!operationResult.stale && !operationResult.hasNext) {
              resolve(operationResult);
            }
          });
        cancel = () => {
          subscription.unsubscribe();
          // Settle, or the awaiting validation rule never returns and
          // QForm.validate() hangs on a query that will never answer.
          resolve(null);
        };
        inFlight.add(cancel);
      });

      // Torn down mid-check: there is no form left to keep from saving.
      if (!result) return true;

      if (result.error) {
        console.error(result.error);
        throw new Error(result.error.message);
      }

      const data = result.data as
        | Record<TableName, { id: number }[]>
        | undefined;
      if (!data?.[tableName]) {
        throw new Error(
          `Missing key ${tableName} in response: ${JSON.stringify(data, null, 2)}`,
        );
      }

      return (
        data[tableName].length === 0 || data[tableName][0]?.id === existingId
      );
    } finally {
      running.value--;
      if (cancel) {
        inFlight.delete(cancel);
        // Idempotent: unsubscribing twice and resolving a settled promise are
        // both no-ops, so the dispose path can run this first.
        cancel();
      }
    }
  }

  return {
    isUnique,
    fetching,
  };
}
