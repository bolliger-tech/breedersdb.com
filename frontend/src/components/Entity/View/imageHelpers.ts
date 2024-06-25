import { type EntityAttributionsViewFragment } from '../entityAttributionsViewFragment';

export function imageFileName({
  row,
  plant,
  plantGroup,
  cultivar,
  lot,
  crossing,
}: {
  row: EntityAttributionsViewFragment;
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
}) {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const entityName =
    plant?.label_id ??
    plantGroup?.display_name ??
    cultivar?.display_name ??
    lot?.display_name ??
    crossing?.name ??
    'unknown';

  return `${org}-${entityName}-${row.attribute_name}-${row.date_attributed}-${row.id}.jpg`;
}

export function metadata({ row }: { row: EntityAttributionsViewFragment }) {
  return `${row.attribute_name}, ${row.date_attributed} ${row.author}`;
}
