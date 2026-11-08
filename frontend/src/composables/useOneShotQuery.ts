import {
  useClientHandle,
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type OperationResult,
} from '@urql/vue';
import { computed, onScopeDispose, ref } from 'vue';

// One-shot queries for async validation rules.
export function useOneShotQuery() {
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

  // Resolves to null if the scope was disposed before the query answered.
  // Rejects if the query failed.
  async function query<Data, Variables extends AnyVariables>(
    document: DocumentInput<Data, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>,
  ): Promise<OperationResult<Data, Variables> | null> {
    running.value++;
    let cancel: (() => void) | undefined;
    try {
      // A one-shot query per call. Sharing urql's reactive query state (as
      // useQuery does) would let a later call orphan the promise of an
      // earlier one and hand it the wrong result. Subscribing by hand rather
      // than via toPromise() keeps the teardown handle; the stale / hasNext
      // filter is what toPromise() applies internally.
      const result = await new Promise<OperationResult<Data, Variables> | null>(
        (resolve) => {
          const subscription = client
            .query(document, variables, context)
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
        },
      );

      if (result?.error) {
        console.error(result.error);
        throw new Error(result.error.message);
      }

      return result;
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

  return { query, fetching };
}
