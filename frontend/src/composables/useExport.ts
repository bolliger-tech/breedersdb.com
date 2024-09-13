import { ref, type Ref } from 'vue';
import * as XLSX from 'xlsx';
import {
  useClientHandle,
  type AnyVariables,
  type DocumentInput,
  type Client,
} from '@urql/vue';
import type { EntityListTableColum } from 'src/components/Entity/List/types';
import type { ResultOf } from 'src/graphql';

type FetchAllPagesArgs<Q extends DocumentInput, V extends AnyVariables> = {
  client: Client;
  entityName: string;
  query: Q;
  variables: V;
};

export function fetchAllData<Q extends DocumentInput, V extends AnyVariables>({
  client,
  entityName,
  query,
  variables,
}: FetchAllPagesArgs<Q, V>) {
  const limit = 200;
  let offset = 0;
  return {
    async *[Symbol.asyncIterator]() {
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
        yield result.data as ResultOf<Q>;
        if (result.data[entityName].length < limit) {
          break;
        }
        offset += limit;
      }
    },
  };
}

export type ExportDataValue =
  | string
  | number
  | boolean
  | Date
  | XLSX.CellObject
  | null;

export type UnnestArgs<T> = {
  data: Array<T>;
  visibleColumns: string[];
};

export type UnnestResult = {
  data: Record<string, ExportDataValue>[];
  visibleColumns: string[];
};

type TransformArgs<T, C extends EntityListTableColum> = {
  result: T;
  columns: C[];
  visibleColumns: string[];
};

export function transformWithColumns<T, C extends EntityListTableColum>({
  result,
  columns,
  visibleColumns,
}: TransformArgs<T, C>) {
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
            : typeof value === 'object' && 't' in value && 'v' in value // is a cell object
              ? value
              : column.name.startsWith('date_') ||
                  ['modified', 'created'].includes(column.name)
                ? new Date(value as string | Date)
                : 'format' in column && column.format
                  ? column.format(value as T[keyof T], result)
                  : value; // should be: string | boolean | number | Date

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
  T,
  Q extends DocumentInput,
  V extends AnyVariables,
  C extends EntityListTableColum = EntityListTableColum,
> = FetchAllPagesArgs<Q, V> &
  Omit<TransformArgs<ResultOf<Q>, C>, 'result'> & {
    title: string;
    subsetLabel?: string;
    sheetName?: string;
    unnestFn?: (args: UnnestArgs<T>) => UnnestResult | undefined;
  };

export function exportData<T, Q extends DocumentInput, V extends AnyVariables>({
  client,
  entityName,
  query,
  variables,
  visibleColumns,
  columns,
  title,
  subsetLabel = 'All',
  unnestFn,
}: ExportDataArgs<T, Q, V>) {
  return {
    async *[Symbol.asyncIterator]() {
      // fetch
      const fetchedData: T[] = [];
      let totalItems = 0;
      for await (const data of fetchAllData({
        client,
        entityName,
        query,
        variables: variables,
      })) {
        fetchedData.push(...data[entityName]);
        totalItems = data[`${entityName}_aggregate`].aggregate.count;
        const progress = fetchedData.length / totalItems;
        yield {
          fetchedData,
          totalItems,
          progress: progress * 0.88,
          done: false,
        };
      }

      // unnest
      const unnestResult =
        unnestFn && unnestFn({ data: fetchedData, visibleColumns });

      yield {
        fetchedData,
        unnestResult,
        progress: 0.9,
        done: false,
      };

      // transform
      const formattedData = (unnestResult?.data || fetchedData).map((result) =>
        transformWithColumns({
          result,
          columns,
          visibleColumns: unnestResult?.visibleColumns || visibleColumns,
        }),
      );

      yield {
        fetchedData,
        unnestResult,
        formattedData,
        progress: 0.95,
        done: false,
      };

      const org = import.meta.env.VITE_ORG_ABBREVIATION;
      const fileName =
        ['bdb', org, title, subsetLabel, new Date().toISOString()]
          .filter(Boolean)
          .join('-') + '.xlsx';

      const worksheet = XLSX.utils.json_to_sheet(formattedData, {
        cellDates: true,
        dateNF: 'dd.mm.yyyy hh:mm:ss',
      });

      yield {
        fetchedData,
        unnestResult,
        formattedData,
        fileName,
        worksheet,
        progress: 1,
        done: true,
      };
    },
  };
}
export function useExport<T, Q extends DocumentInput, V extends AnyVariables>(
  args: Omit<
    ExportDataArgs<T, Q, V>,
    'client' | 'query' | 'variables' | 'columns' | 'visibleColumns'
  > & {
    query: Ref<Q>;
    variables: Ref<V>;
    columns: Ref<ExportDataArgs<T, Q, V>['columns']>;
    visibleColumns: Ref<ExportDataArgs<T, Q, V>['visibleColumns']>;
  },
) {
  const isExporting = ref(false);
  const progress = ref(0);
  const { client } = useClientHandle();

  const _exportData = async () => {
    progress.value = 0;
    isExporting.value = true;
    let lastData;
    for await (const d of exportData({
      ...args,
      client,
      query: args.query.value,
      variables: args.variables.value,
      columns: args.columns.value,
      visibleColumns: args.visibleColumns.value,
    })) {
      progress.value = Math.min(d.progress, 0.99);
      if (d.worksheet) {
        lastData = d;
      }
    }
    return lastData;
  };

  return {
    isExporting,
    exportProgress: progress,
    exportData: async () => {
      if (isExporting.value) {
        return;
      }
      const data = await _exportData();
      progress.value = 1;
      isExporting.value = false;
      return data;
    },
    exportDataAndWriteNewXLSX: async () => {
      if (isExporting.value) {
        return;
      }
      const data = await _exportData();
      if (!data) {
        isExporting.value = false;
        throw new Error('No data to export');
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, data.worksheet);
      await XLSX.writeFile(workbook, data.fileName);

      progress.value = 1;
      setTimeout(() => {
        isExporting.value = false;
      }, 800);

      return data;
    },
  };
}
