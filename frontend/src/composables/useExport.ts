import { ref, type Ref } from 'vue';
import * as XLSX from 'xlsx';
import {
  useClientHandle,
  type AnyVariables,
  type DocumentInput,
  type Client,
} from '@urql/vue';
import type { EntityListTableColum } from 'src/components/Entity/List/EntityListTable.vue';
import type { ResultOf } from 'src/graphql';

type FetchAllPagesArgs<Q extends DocumentInput, V extends AnyVariables> = {
  client: Client;
  entityName: string;
  query: Q;
  variables: V;
};

export async function fetchAllPages<
  Q extends DocumentInput,
  V extends AnyVariables,
>({ client, entityName, query, variables }: FetchAllPagesArgs<Q, V>) {
  const allResults: ResultOf<Q>[] = [];
  const limit = 100;
  let offset = 0;

  // Fetch data in chunks
  while (true) {
    const result = await client
      .query(
        query,
        { ...variables, limit, offset },
        { requestPolicy: 'network-only' },
      )
      .toPromise();
    if (!result.data) {
      break;
    }
    allResults.push(...result.data[entityName]);
    if (result.data[entityName].length < limit) {
      break;
    }
    offset += limit;
  }

  return allResults;
}

type TransformToColumnArgs<T, C extends EntityListTableColum> = {
  result: T;
  columns: C[];
  visibleColumns: string[];
};

export function transformWithColumns<T, C extends EntityListTableColum>({
  result,
  columns,
  visibleColumns,
}: TransformToColumnArgs<T, C>) {
  return columns
    .filter((column) => visibleColumns.includes(column.name))
    .reduce(
      (row, column) => {
        const value =
          typeof column.field === 'function'
            ? column.field(result)
            : result[column.field as keyof T];

        const formattedValue =
          value === null || value === undefined || value === ''
            ? null
            : column.name.startsWith('date_') ||
                ['modified', 'created'].includes(column.name)
              ? new Date(value as string)
              : 'format' in column && column.format
                ? column.format(value as T[keyof T], result)
                : value; // can be anything

        return {
          ...row,
          [column.label]: formattedValue,
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<EntityListTableColum['label'], any>,
    );
}

type ExportDataArgs<
  Q extends DocumentInput,
  V extends AnyVariables,
  C extends EntityListTableColum = EntityListTableColum,
> = FetchAllPagesArgs<Q, V> &
  Omit<TransformToColumnArgs<ResultOf<Q>, C>, 'result'> & {
    title: string;
    subsetLabel?: string;
    sheetName?: string;
  };

export async function exportData<
  Q extends DocumentInput,
  V extends AnyVariables,
>({
  client,
  entityName,
  query,
  variables,
  visibleColumns,
  columns,
  title,
  subsetLabel = 'All',
}: ExportDataArgs<Q, V>) {
  const fetchedData = await fetchAllPages({
    client,
    entityName,
    query,
    variables: variables,
  });

  const formattedData = fetchedData.map((result) =>
    transformWithColumns({
      result,
      columns,
      visibleColumns,
    }),
  );

  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const fileName =
    ['bdb', org, title, subsetLabel, new Date().toISOString()]
      .filter(Boolean)
      .join('-') + '.xlsx';

  const worksheet = XLSX.utils.json_to_sheet(formattedData, {
    cellDates: true,
    dateNF: 'dd.mm.yyyy hh:mm:ss',
  });

  return { fetchedData, formattedData, fileName, worksheet };
}

export function useExport<Q extends DocumentInput, V extends AnyVariables>(
  args: Omit<
    ExportDataArgs<Q, V>,
    'client' | 'variables' | 'columns' | 'visibleColumns'
  > & {
    variables: Ref<V>;
    columns: Ref<ExportDataArgs<Q, V>['columns']>;
    visibleColumns: Ref<ExportDataArgs<Q, V>['visibleColumns']>;
  },
) {
  const isExporting = ref(false);
  const { client } = useClientHandle();

  const _exportData = async () =>
    exportData({
      ...args,
      client,
      variables: args.variables.value,
      columns: args.columns.value,
      visibleColumns: args.visibleColumns.value,
    });

  return {
    isExporting,
    exportData: async () => {
      isExporting.value = true;
      return _exportData().finally(() => {
        isExporting.value = false;
      });
    },
    exportDataAndWriteNewXLSX: async () => {
      isExporting.value = true;
      const workbook = XLSX.utils.book_new();
      return _exportData()
        .then(async (args) => {
          XLSX.utils.book_append_sheet(workbook, args.worksheet);
          await XLSX.writeFile(workbook, args.fileName);
          return args;
        })
        .finally(() => {
          isExporting.value = false;
        });
    },
  };
}
