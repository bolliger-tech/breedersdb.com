import { ATTACHMENT_FILE_NAME_REGEX } from './fileName';

// Only types that can't run scripts may be rendered by the browser.
// See docs/adr/0002-attachments-content-addressed-and-public.md
const INLINE_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  txt: 'text/plain; charset=utf-8',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
};

/**
 * @param fileName the storage file name, must match ATTACHMENT_FILE_NAME_REGEX
 * @param displayName the file name suggested to the browser
 */
export function getContentHeaders(fileName: string, displayName: string) {
  const ext = fileName.match(ATTACHMENT_FILE_NAME_REGEX)?.[1];
  const inlineContentType = ext ? INLINE_CONTENT_TYPES[ext] : undefined;

  const name = getDownloadName(displayName, ext) || fileName;
  const asciiName = name.replace(/[^\x20-\x7e]|"/g, '_');
  // RFC 5987 attr-char doesn't allow '()*, which encodeURIComponent keeps
  const encodedName = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const disposition = inlineContentType ? 'inline' : 'attachment';

  return {
    'Content-Type': inlineContentType ?? 'application/octet-stream',
    'Content-Disposition': `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
  };
}

// the stored extension decides how the file is served, so the browser
// must save it with the same extension (e.g. not as .exe)
function getDownloadName(displayName: string, ext: string | undefined) {
  const baseName = displayName
    .replace(/[/\\\x00-\x1f\x7f]/g, '')
    .trim()
    .replace(/\.[a-z0-9]{1,10}$/i, '');
  if (!baseName) {
    return '';
  }
  return ext ? `${baseName}.${ext}` : baseName;
}
