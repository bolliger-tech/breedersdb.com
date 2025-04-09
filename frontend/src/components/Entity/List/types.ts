import type { QTableColumn } from 'quasar';

export type EntityListTableColum = Omit<QTableColumn, 'sort'> & {
  maxWidth?: string;
  ellipsis?: boolean;
  timestamp?: boolean;
  monospaced?: boolean;
  muted?: boolean;
};
