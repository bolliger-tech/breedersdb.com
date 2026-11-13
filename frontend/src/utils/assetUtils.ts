import type { CellObject } from 'xlsx';
import type { AllowedImageSizes } from './imageSizes';
import { getAttributedEntityName } from './attributeUtils';

// must correspond to the cloud-function's upload limit
export const UPLOAD_MAX_SIZE = 16 * 1024 * 1024; // bytes

// stored file names are <sha256>[.<ext>], see the cloud-function's upload
function getExtension(fileName: string) {
  return fileName.split('.')[1];
}

export function isFileTooLarge(file: { size: number }) {
  return file.size > UPLOAD_MAX_SIZE;
}

/**
 * The name a photo or attachment is downloaded with. The stored file name
 * only provides the extension.
 */
export function getDownloadFileName({
  fileName,
  attributeName,
  entityName,
  dateAttributed,
  attributionId,
}: {
  fileName: string;
  attributeName: string;
  entityName?: string | undefined;
  dateAttributed: string;
  attributionId?: number | undefined;
}) {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const prefix = ['bdb', org].filter(Boolean).join('-');
  const ext = getExtension(fileName);
  const name = [
    prefix,
    attributeName,
    entityName,
    dateAttributed,
    attributionId,
  ]
    .filter((part) => part !== undefined && part !== '')
    .map((part) => String(part).replace(/\s+/g, '-'))
    .join('_');
  return ext ? `${name}.${ext}` : name;
}

export function getAttributionDownloadFileName(
  attribution: Parameters<typeof getAttributedEntityName>[0] & {
    attribute_name: string;
    date_attributed: string;
    id: number;
  },
  fileName: string,
) {
  return getDownloadFileName({
    fileName,
    attributeName: attribution.attribute_name,
    entityName: getAttributedEntityName(attribution) ?? 'unknown',
    dateAttributed: attribution.date_attributed,
    attributionId: attribution.id,
  });
}

export function getImageUrlRelative({
  fileName,
  downloadFileName,
  dimensions,
}: {
  fileName: string;
  downloadFileName: string;
  dimensions?: AllowedImageSizes;
}) {
  const { width: maxWidth, height: maxHeight } = dimensions ?? {};
  return (
    `/api/assets/images/${encodeURIComponent(downloadFileName)}?file=${fileName}` +
    (maxWidth ? `&width=${maxWidth}` : '') +
    (maxHeight ? `&height=${maxHeight}` : '')
  );
}

export function getAttachmentUrlRelative({
  fileName,
  downloadFileName,
}: {
  fileName: string;
  downloadFileName: string;
}) {
  return `/api/assets/attachments/${encodeURIComponent(downloadFileName)}?file=${fileName}`;
}

export function getLinkCell(urlRelative: string): CellObject {
  const url = `${window.location.origin}${urlRelative}`;
  return {
    t: 's',
    v: url,
    l: {
      Target: url,
    },
  };
}

const ATTACHMENT_ICONS: [string, string[]][] = [
  ['picture_as_pdf', ['pdf']],
  [
    'image',
    [
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'avif',
      'svg',
      'heic',
      'tif',
      'tiff',
      'bmp',
    ],
  ],
  ['movie', ['mp4', 'webm', 'mov', 'avi', 'mkv']],
  ['audio_file', ['mp3', 'wav', 'ogg', 'm4a', 'flac']],
  ['table_chart', ['csv', 'tsv', 'xls', 'xlsx', 'ods']],
  ['description', ['txt', 'md', 'rtf', 'doc', 'docx', 'odt']],
];

export function getAttachmentIcon(fileName: string) {
  const ext = getExtension(fileName);
  return (
    ATTACHMENT_ICONS.find(
      ([, extensions]) => ext && extensions.includes(ext),
    )?.[0] ?? 'insert_drive_file'
  );
}
