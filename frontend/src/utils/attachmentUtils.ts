import type { CellObject } from 'xlsx';

export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // bytes

// stored file names are <sha256>[.<ext>], see the cloud-function's upload
function getExtension(fileName: string) {
  return fileName.split('.')[1];
}

export function isAttachmentTooLarge(file: { size: number }) {
  return file.size > ATTACHMENT_MAX_SIZE;
}

export function getAttachmentFileName({
  attributeName,
  entityName,
  dateAttributed,
  fileName,
}: {
  attributeName: string;
  entityName?: string | undefined;
  dateAttributed: string;
  fileName: string;
}) {
  const ext = getExtension(fileName);
  const name = [attributeName, entityName, dateAttributed]
    .filter(Boolean)
    .map((part) => part!.replace(/\s+/g, '-'))
    .join('_');
  return ext ? `${name}.${ext}` : name;
}

export function getAttachmentUrlRelative({
  fileName,
  desiredFileName,
}: {
  fileName: string;
  desiredFileName: string;
}) {
  return `/api/assets/attachments/${encodeURIComponent(desiredFileName)}?file=${fileName}`;
}

export function getAttachmentCell(
  args: Parameters<typeof getAttachmentFileName>[0],
): CellObject {
  const url = `${window.location.origin}${getAttachmentUrlRelative({
    fileName: args.fileName,
    desiredFileName: getAttachmentFileName(args),
  })}`;
  return {
    t: 's',
    v: url,
    l: {
      Target: url,
    },
  };
}

const ICONS: [string, string[]][] = [
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
    ICONS.find(([, extensions]) => ext && extensions.includes(ext))?.[0] ??
    'insert_drive_file'
  );
}
