import { XLSX_FORMATS } from 'src/composables/useExport';
import type { CellObject } from 'xlsx';
import { getImageCell } from 'src/utils/imageUtils';

import {
  type AnalyzeAttributionsViewFields,
  attributionValueKeys,
} from './filterToQuery';

export type AnalyzeAttributionsViewValueFields = Pick<
  AnalyzeAttributionsViewFields,
  | 'integer_value'
  | 'float_value'
  | 'text_value'
  | 'boolean_value'
  | 'date_value'
>;

export type AnalyzeAttributionsViewObjectFields = Pick<
  AnalyzeAttributionsViewFields,
  'plant' | 'plant_group' | 'cultivar' | 'lot'
>;

export const attributionObjectKeys: (keyof AnalyzeAttributionsViewObjectFields)[] =
  ['plant', 'plant_group', 'cultivar', 'lot'];

export function getAttributionObjectName(
  attribution: AnalyzeAttributionsViewFields,
) {
  return (
    attribution.plant?.label_id ??
    attribution.plant_group?.display_name ??
    attribution.cultivar?.display_name ??
    attribution.lot?.display_name ??
    'unknown'
  );
}

export function getAttributionObjectType(
  attribution: AnalyzeAttributionsViewFields,
) {
  return attribution.plant
    ? 'plant'
    : attribution.plant_group
      ? 'plant_group'
      : attribution.cultivar
        ? 'cultivar'
        : attribution.lot
          ? 'lot'
          : 'unknown';
}

function attributionValueToXlsx(attribution: AnalyzeAttributionsViewFields) {
  const entityName = getAttributionObjectName(attribution);
  const valueKey = attributionValueKeys.find(
    (key) => attribution[key] !== null,
  );
  const value =
    !valueKey || !(valueKey in attribution) || !attribution[valueKey]
      ? null
      : valueKey === 'date_value'
        ? ({
            t: 'd',
            v: new Date(attribution[valueKey]),
            z: XLSX_FORMATS.date,
          } as CellObject)
        : valueKey === 'boolean_value'
          ? !!attribution[valueKey]
          : attribution.data_type === 'PHOTO'
            ? getImageCell({
                serverFileName: attribution[valueKey] as string,
                entityName,
                attributeName: attribution.attribute_name,
                dateAttributed: attribution.date_attributed,
                attributionId: attribution.id,
              })
            : attribution[valueKey];
  return value;
}

export function attributionToXlsx(attribution: AnalyzeAttributionsViewFields) {
  const value = attributionValueToXlsx(attribution);
  const entityName = getAttributionObjectName(attribution);
  const objectType = getAttributionObjectType(attribution);
  return {
    ...(Object.fromEntries(
      Object.entries(attribution)
        .filter(([k]) => !attributionObjectKeys.find((key) => key === k))
        .map(([k, v]) => [
          k,
          !v
            ? v
            : k === 'photo_note'
              ? getImageCell({
                  serverFileName: v as string,
                  entityName,
                  attributeName: attribution.attribute_name,
                  dateAttributed: attribution.date_attributed,
                  attributionId: attribution.id,
                })
              : k === 'created'
                ? new Date(v as string)
                : v,
        ]),
    ) as { [x: string]: string | number | boolean | Date | CellObject }),
    value,
    attributed_object_type: objectType,
    attributed_object_name: entityName,
  };
}
