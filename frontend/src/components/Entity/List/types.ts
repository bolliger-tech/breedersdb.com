import type { QTableColumn } from 'quasar';

// this would naturally be placed in EntityListTable.vue
// but then tsc errors in useExport.ts:
//   Module '"*.vue"' has no exported member 'EntityListTableColum'.
//   Did you mean to use 'import EntityListTableColum from "*.vue"' instead?

export type EntityListTableColum = Omit<QTableColumn, 'sort'> & {
  maxWidth?: string;
  ellipsis?: boolean;
  timestamp?: boolean;
};
