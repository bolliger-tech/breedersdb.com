import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { nextTick, ref, computed, type Ref } from 'vue';

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

  const term = ref('');
  const variables = computed(() => ({
    where: { [columnName]: { _eq: term.value }, ...additionalWhere?.value },
  }));
  const { fetching, ...urql } = useQuery({
    query: query,
    variables,
    pause: true,
    requestPolicy: 'cache-and-network',
  });

  async function isUnique(newName: string) {
    term.value = newName;
    await nextTick(); // wait for the refs to be updated
    const result = await urql.executeQuery();
    if (result.error.value) {
      console.error(result.error.value);
      throw new Error(result.error.value.message);
    }
    const data = result.data?.value as Record<TableName, { id: number }[]>;
    return (
      data?.[tableName].length === 0 || data?.[tableName][0]?.id === existingId
    );
  }

  return {
    isUnique,
    fetching,
  };
}
