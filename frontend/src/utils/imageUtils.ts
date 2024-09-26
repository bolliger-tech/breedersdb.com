import type { CellObject } from 'xlsx';

export function getImageFileName({
  entityName,
  attributeName,
  dateAttributed,
  attributionId,
}: {
  entityName: string;
  attributeName: string;
  dateAttributed: string;
  attributionId: number;
}) {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  return (
    ['bdb', org, entityName, attributeName, dateAttributed, attributionId]
      .filter(Boolean)
      .join('-') + '.jpg'
  );
}

export function getImageUrlRelative({
  serverFileName,
  desiredFileName,
  maxWidth,
  maxHeight,
}: {
  serverFileName: string;
  desiredFileName: string;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const desiredFileNameEncoded = encodeURIComponent(desiredFileName);
  return (
    `/api/assets/images/${desiredFileNameEncoded}?file=${serverFileName}` +
    (maxWidth ? `&width=${maxWidth}` : '') +
    (maxHeight ? `&height=${maxHeight}` : '')
  );
}

export function getImageCell({
  serverFileName,
  entityName,
  attributeName,
  dateAttributed,
  attributionId,
}: {
  serverFileName: string;
  entityName: string;
  attributeName: string;
  dateAttributed: string;
  attributionId: number;
}): CellObject {
  const fileName = getImageFileName({
    entityName,
    attributeName,
    dateAttributed,
    attributionId,
  });
  return {
    t: 's',
    v: fileName,
    l: {
      Target: `${window.location.origin}${getImageUrlRelative({
        serverFileName,
        desiredFileName: fileName,
      })}`,
    },
  };
}
