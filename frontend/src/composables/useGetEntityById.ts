import { nextTick, ref } from 'vue';
import { useQuery } from '@urql/vue';
import type { TadaDocumentNode } from 'gql.tada';

export function useGetEntityById<T>({
  query,
  additionalTypenames,
}: {
  query: TadaDocumentNode<T, { id: number }>;
  additionalTypenames: string[];
}) {
  const variables = ref({ id: -1 });
  const { data, error, ...urql } = useQuery({
    query,
    variables,
    context: { additionalTypenames },
    pause: true,
  });

  async function getEntity(id: number) {
    variables.value.id = id;
    await nextTick();
    await urql.executeQuery();
    await nextTick();
    if (error.value) {
      throw error.value;
    }
    if (!data.value) {
      throw new Error(`Failed to get entity with id ${id}`);
    }
    return data;
  }

  return {
    getEntity,
  };
}
