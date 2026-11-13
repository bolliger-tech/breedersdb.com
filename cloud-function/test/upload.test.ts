import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageUploadConfig } from '../dist/images/upload.js';
import { attachmentUploadConfig } from '../dist/attachments/upload.js';

const hash = 'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65';

test('images are stored as jpg under images/', () => {
  assert.equal(imageUploadConfig.storagePrefix, 'images/');
  assert.equal(imageUploadConfig.getFileName(hash, 'photo.png'), `${hash}.jpg`);
  assert.equal(imageUploadConfig.getFileName(hash, undefined), `${hash}.jpg`);
});

test('images must be jpeg', async () => {
  assert.equal(
    await imageUploadConfig.validate(Buffer.from('not an image')),
    'Invalid image',
  );
});

test('attachments keep the extension under attachments/', () => {
  assert.equal(attachmentUploadConfig.storagePrefix, 'attachments/');
  assert.equal(
    attachmentUploadConfig.getFileName(hash, 'Report.PDF'),
    `${hash}.pdf`,
  );
  assert.equal(attachmentUploadConfig.getFileName(hash, 'README'), hash);
});
