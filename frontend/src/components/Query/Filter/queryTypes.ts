// import { AttributeSchema } from './attributeSchemaTypes';
// import { TreeView } from 'src/models/tree';
// import { VarietyView } from 'src/models/variety';
// import { BatchView } from 'src/models/batch';

// export type QueryResponseDebug = {
//   sql: string;
//   params: {
//     [key: string]: {
//       value: string;
//       type: string;
//       placeholder: string;
//     };
//   };
// };

// export type ViewEntity = {
//   [key: string]: null | number | string | ViewEntity[];
// };
// export type QueryResponseSchemas = { [key: string]: AttributeSchema[] };

// export interface QueryResponse {
//   count: number;
//   offset: number;
//   sortBy: string;
//   order: 'asc' | 'desc';
//   limit: number;
//   debug: null | QueryResponseDebug;
//   results: ViewEntity[];
//   schema: QueryResponseSchemas;
// }

// export interface AttributionCell {
//   id: number;
//   attribute_id: number;
//   name: string;
//   author: string;
//   batch_id: number | null;
//   variety_id: number | null;
//   tree_id: number | null;
//   date: string;
//   exceptional_attribution: boolean;
//   field_type: 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'VARCHAR' | 'PHOTO';
//   attribute_type: string;
//   value: string | number | boolean;
//   entity: unknown; // TODO: TreeView | VarietyView | BatchView;
// }

// export interface AggregatedAttributionCell {
//   attribute_id: number;
//   name: string;
//   value: string | number | boolean;
//   rawValues: AttributionCell[];
// }

// export interface Query {
//   id: number;
//   code: string;
//   raw_query: AttributionQuery;
//   description: string | null;
//   query_group_id: number;
//   created: string | null;
//   modified: string | null;
//   deleted: string | null;
// }

// export interface AttributionQuery {
//   _BaseTable: _BaseTable;
//   baseFilter: FilterNode;
//   attributionFilter?: FilterNode;
//   visibleColumns: string[];
//   showRowsWithoutAttributions: boolean;
// }
