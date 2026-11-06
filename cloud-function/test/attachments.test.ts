import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExtension } from '../dist/attachments/fileName.js';
import { getContentHeaders } from '../dist/attachments/contentHeaders.js';

const hash = 'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65';

test('parseExtension', () => {
  assert.equal(parseExtension('report.pdf'), 'pdf');
  assert.equal(parseExtension('Report.PDF'), 'pdf');
  assert.equal(parseExtension('archive.tar.gz'), 'gz');
  assert.equal(parseExtension('a.7z'), '7z');
  assert.equal(parseExtension('a.abcdefghij'), 'abcdefghij');
  assert.equal(parseExtension('a.abcdefghijk'), undefined);
  assert.equal(parseExtension('a.p-f'), undefined);
  assert.equal(parseExtension('a.'), undefined);
  assert.equal(parseExtension('README'), undefined);
  assert.equal(parseExtension('.pdf'), undefined);
  assert.equal(parseExtension('My%20Report.pdf'), 'pdf');
  assert.equal(parseExtension(undefined), undefined);
});

test('getContentHeaders: allowlisted extensions are inline', () => {
  const expected: Record<string, string> = {
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
  for (const [ext, contentType] of Object.entries(expected)) {
    const headers = getContentHeaders(`${hash}.${ext}`, `file.${ext}`);
    assert.equal(headers['Content-Type'], contentType);
    assert.match(headers['Content-Disposition'], /^inline; /);
  }
});

test('getContentHeaders: everything else is a download', () => {
  for (const fileName of ['html', 'htm', 'csv', 'svg', 'xml', 'js', 'zip'].map(
    (ext) => `${hash}.${ext}`,
  )) {
    const headers = getContentHeaders(fileName, 'file');
    assert.equal(headers['Content-Type'], 'application/octet-stream');
    assert.match(headers['Content-Disposition'], /^attachment; /);
  }
  assert.equal(
    getContentHeaders(hash, 'file')['Content-Type'],
    'application/octet-stream',
  );
});

test('getContentHeaders: the stored extension decides, not the display name', () => {
  const headers = getContentHeaders(`${hash}.html`, 'file.pdf');
  assert.equal(headers['Content-Type'], 'application/octet-stream');
  assert.match(headers['Content-Disposition'], /^attachment; /);
});

test('getContentHeaders: display name', () => {
  assert.equal(
    getContentHeaders(`${hash}.pdf`, 'Report 1.pdf')['Content-Disposition'],
    `inline; filename="Report 1.pdf"; filename*=UTF-8''Report%201.pdf`,
  );
  assert.equal(
    getContentHeaders(`${hash}.pdf`, "Bäume (alt)*'.pdf")[
      'Content-Disposition'
    ],
    `inline; filename="B_ume (alt)*'.pdf"; filename*=UTF-8''B%C3%A4ume%20%28alt%29%2A%27.pdf`,
  );
  assert.equal(
    getContentHeaders(`${hash}.pdf`, '../a\\b"c\r\n\x00\x7f.pdf')[
      'Content-Disposition'
    ],
    `inline; filename="..ab_c.pdf"; filename*=UTF-8''..ab%22c.pdf`,
  );
  assert.equal(
    getContentHeaders(`${hash}.pdf`, '/\n')['Content-Disposition'],
    `inline; filename="${hash}.pdf"; filename*=UTF-8''${hash}.pdf`,
  );
});
