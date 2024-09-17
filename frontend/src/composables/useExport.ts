import { ref, type MaybeRef, toValue } from 'vue';
import * as XLSX from 'xlsx';
import {
  useClientHandle,
  type AnyVariables,
  type DocumentInput,
  type Client,
} from '@urql/vue';
import type { EntityListTableColum } from 'src/components/Entity/List/types';
import type { ResultOf } from 'src/graphql';

export const XLSX_FORMATS = {
  dateTime: 'dd.mm.yyyy hh:mm:ss',
  date: 'dd.mm.yyyy',
};

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
  let asdf = 0;
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
        if (asdf++ > 3) {
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

export type TransformDataArgs<T> = {
  data: Array<T>;
  visibleColumns: string[];
};

export type TransformDataResult = {
  data: Record<string, ExportDataValue | unknown>[];
  visibleColumns: string[];
};

type FormatXlsxRowsWithColumns<T, C extends EntityListTableColum> = {
  result: T;
  columns: C[];
  visibleColumns: string[];
};

export function formatXlsxRowsWithColumns<T, C extends EntityListTableColum>({
  result,
  columns,
  visibleColumns,
}: FormatXlsxRowsWithColumns<T, C>) {
  console.log('visibleColumns', visibleColumns);
  // visibleColumns defines the order
  return visibleColumns.reduce(
    (row, visibleColumn) => {
      const column = columns.find((c) => c.name === visibleColumn);
      if (!column) {
        return row;
      }
      const value =
        typeof column.field === 'function'
          ? column.field(result)
          : result[column.field as keyof T];

      const formattedValue =
        value === null || value === undefined || value === ''
          ? null
          : typeof value === 'object' && 't' in value && 'v' in value // is a cell object
            ? value
            : column.name.startsWith('date_')
              ? ({
                  t: 'd',
                  v: new Date(value as string | Date),
                  z: XLSX_FORMATS.date,
                } as XLSX.CellObject)
              : ['modified', 'created'].includes(column.name) &&
                  typeof value === 'string'
                ? new Date(value as string | Date)
                : value; // should be: string | boolean | number | Date

      return {
        ...row,
        [column.label]: formattedValue,
      };
    },
    {} as Record<'string', ExportDataValue>,
  );
}

type ExportDataArgs<
  T,
  Q extends DocumentInput,
  V extends AnyVariables,
  C extends EntityListTableColum = EntityListTableColum,
> = FetchAllPagesArgs<Q, V> &
  Omit<FormatXlsxRowsWithColumns<ResultOf<Q>, C>, 'result'> & {
    title: string;
    subsetLabel?: string;
    sheetName?: string;
    transformDataFn?: (
      args: TransformDataArgs<T>,
    ) => TransformDataResult | undefined;
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
  transformDataFn,
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

      // transform (eg. unnest)
      const transformResult =
        transformDataFn &&
        transformDataFn({ data: fetchedData, visibleColumns });

      // intermidiate data (fetchedData, etc.) could be removed to save memory
      yield {
        fetchedData,
        transformResult,
        progress: 0.9,
        done: false,
      };

      // transform
      const formattedData = (transformResult?.data || fetchedData).map(
        (result) =>
          formatXlsxRowsWithColumns({
            result,
            columns,
            visibleColumns: transformResult?.visibleColumns || visibleColumns,
          }),
      );

      yield {
        fetchedData,
        transformResult,
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
        dateNF: XLSX_FORMATS.dateTime,
      });

      console.log('exportData', {
        fetchedData,
        transformResult,
        formattedData,
        fileName,
        worksheet,
      });

      yield {
        fetchedData,
        transformResult,
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
    | 'client'
    | 'query'
    | 'variables'
    | 'columns'
    | 'visibleColumns'
    | 'subsetLabel'
  > & {
    query: MaybeRef<Q>;
    variables: MaybeRef<V>;
    columns: MaybeRef<ExportDataArgs<T, Q, V>['columns']>;
    visibleColumns: MaybeRef<ExportDataArgs<T, Q, V>['visibleColumns']>;
    subsetLabel?: MaybeRef<string | undefined>;
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
      query: toValue(args.query),
      variables: toValue(args.variables),
      columns: toValue(args.columns),
      visibleColumns: toValue(args.visibleColumns),
      subsetLabel: toValue(args.subsetLabel),
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
