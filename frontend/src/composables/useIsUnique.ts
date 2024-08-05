import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { nextTick, ref } from 'vue';

type TableName = string;

export function useIsUnique({
  tableName,
  existingId,
  columnName = 'name',
  columnType = 'String',
}: {
  tableName: TableName;
  existingId?: number;
  columnName?: string;
  columnType?: string;
}) {
  const query = graphql(`
    query UniqueQueryFor_${tableName}($input: ${columnType}!) {
      ${tableName}(where: { ${columnName}: { _eq: $input } }, limit: 1) {
        id
      }
    }
  `);

  const variables = ref({ input: '' });

  const { executeQuery, fetching } = useQuery({
    query,
    variables,
    pause: true,
    requestPolicy: 'cache-and-network',
  });

  async function isUnique(newName: string) {
    variables.value.input = newName;
    await nextTick(); // wait for the refs to be updated
    const result = await executeQuery();
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
