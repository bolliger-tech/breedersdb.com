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
  return `${org ? `${org}-` : ''}${entityName}-${attributeName}-${dateAttributed}-${attributionId}.jpg`;
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
