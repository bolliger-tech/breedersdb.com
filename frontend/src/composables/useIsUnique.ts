import { graphql } from 'src/graphql';
import { type Ref } from 'vue';
import { useOneShotQuery } from 'src/composables/useOneShotQuery';

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

  const { query: queryOnce, fetching } = useOneShotQuery();

  async function isUnique(newName: string) {
    const result = await queryOnce(
      query,
      {
        where: {
          [columnName]: { _eq: newName },
          ...additionalWhere?.value,
        },
      },
      { requestPolicy: 'cache-and-network' },
    );

    // Torn down mid-check: there is no form left to keep from saving.
    if (!result) return true;

    if (result.error) {
      console.error(result.error);
      throw new Error(result.error.message);
    }

    const data = result.data as Record<TableName, { id: number }[]> | undefined;
    if (!data?.[tableName]) {
      throw new Error(
        `Missing key ${tableName} in response: ${JSON.stringify(data, null, 2)}`,
      );
    }

    return (
      data[tableName].length === 0 || data[tableName][0]?.id === existingId
    );
  }

  return {
    isUnique,
    fetching,
  };
}
