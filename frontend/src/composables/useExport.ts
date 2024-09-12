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
  const limit = 100;
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

export function exportData<Q extends DocumentInput, V extends AnyVariables>({
  client,
  entityName,
  query,
  variables,
  visibleColumns,
  columns,
  title,
  subsetLabel = 'All',
}: ExportDataArgs<Q, V>) {
  return {
    async *[Symbol.asyncIterator]() {
      const entityData = [];
      let totalItems = 0;
      for await (const data of fetchAllData({
        client,
        entityName,
        query,
        variables: variables,
      })) {
        entityData.push(...data[entityName]);
        totalItems = data[`${entityName}_aggregate`].aggregate.count;
        const progress = entityData.length / totalItems;
        yield {
          fetchedData: entityData,
          totalItems,
          progress: progress * 0.88,
          done: false,
        };
      }

      const formattedData = entityData.map((result) =>
        transformWithColumns({
          result,
          columns,
          visibleColumns,
        }),
      );
      yield {
        fetchedData: entityData,
        formattedData,
        progress: 0.9,
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
        fetchedData: entityData,
        formattedData,
        fileName,
        worksheet,
        progress: 1,
        done: true,
      };
    },
  };
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
  const progress = ref(0);
  const { client } = useClientHandle();

  const _exportData = () =>
    exportData({
      ...args,
      client,
      variables: args.variables.value,
      columns: args.columns.value,
      visibleColumns: args.visibleColumns.value,
    });

  return {
    isExporting,
    exportProgress: progress,
    exportData: async () => {
      if (isExporting.value) {
        return;
      }
      progress.value = 0;
      isExporting.value = true;
      let lastData;
      for await (const d of _exportData()) {
        progress.value = d.progress;
        lastData = d;
      }
      isExporting.value = false;
      return lastData;
    },
    exportDataAndWriteNewXLSX: async () => {
      if (isExporting.value) {
        return;
      }
      progress.value = 0;
      isExporting.value = true;
      const workbook = XLSX.utils.book_new();
      let data;
      for await (const d of _exportData()) {
        progress.value = Math.min(d.progress, 0.99);
        if (d.worksheet) {
          data = d;
        }
      }

      if (!data) {
        isExporting.value = false;
        throw new Error('No data to export');
      }

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
