import type { CellObject } from 'xlsx';
import type { AllowedImageSizes } from './imageSizes';

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
  dimensions,
}: {
  serverFileName: string;
  desiredFileName: string;
  dimensions?: AllowedImageSizes;
}) {
  const desiredFileNameEncoded = encodeURIComponent(desiredFileName);
  const { width: maxWidth, height: maxHeight } = dimensions ?? {};
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
