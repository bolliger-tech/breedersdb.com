import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneUnreferencedFiles } from '../dist/lib/prune.js';
import { imagePruneConfig } from '../dist/images/prune.js';
import { attachmentPruneConfig } from '../dist/attachments/prune.js';

const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((char) => char.repeat(64));
const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
const young = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

// lists all given files on a single page, ignoring prefix and delimiter.
// with `fields` set, gcs returns plain objects instead of File instances.
function createStorage(files: { name: string; timeCreated: string }[]) {
  const listOptions: unknown[] = [];
  const deleted: string[] = [];
  return {
    listOptions,
    deleted,
    getFiles: async (options: unknown) => {
      listOptions.push(options);
      return [files, null];
    },
    deleteFile: async (name: string) => {
      deleted.push(name);
    },
  };
}

test('images prune lists images and keeps referenced ones', async () => {
  const storage = createStorage([
    { name: `images/${a}.jpg`, timeCreated: old },
    { name: `images/${b}.jpg`, timeCreated: old },
    { name: `images/${c}.pdf`, timeCreated: old },
  ]);
  let queried: string[] = [];

  const result = await pruneUnreferencedFiles({
    ...imagePruneConfig,
    getReferenced: async (fileNames: string[]) => {
      queried = fileNames;
      return [`${a}.jpg`];
    },
    storage,
  });

  assert.equal((storage.listOptions[0] as any).prefix, 'images/');
  assert.deepEqual(queried, [`${a}.jpg`, `${b}.jpg`]);
  assert.deepEqual(storage.deleted, [`images/${b}.jpg`]);
  assert.deepEqual(result.deleted, [`images/${b}.jpg`]);
});

test('attachments prune lists attachments and keeps referenced ones', async () => {
  const storage = createStorage([
    { name: `attachments/${a}.pdf`, timeCreated: old },
    { name: `attachments/${b}`, timeCreated: old },
    { name: `attachments/${c}.pdf`, timeCreated: old },
    { name: 'attachments/garbage', timeCreated: old },
  ]);
  let queried: string[] = [];

  await pruneUnreferencedFiles({
    ...attachmentPruneConfig,
    getReferenced: async (fileNames: string[]) => {
      queried = fileNames;
      return [`${a}.pdf`, b];
    },
    storage,
  });

  assert.equal((storage.listOptions[0] as any).prefix, 'attachments/');
  assert.deepEqual(queried, [`${a}.pdf`, b, `${c}.pdf`]);
  assert.deepEqual(storage.deleted, [`attachments/${c}.pdf`]);
});

test('prune keeps files younger than 24 hours', async () => {
  const storage = createStorage([
    { name: `images/${a}.jpg`, timeCreated: young },
    { name: `images/${d}.jpg`, timeCreated: old },
    { name: `attachments/${c}.pdf`, timeCreated: young },
  ]);

  await pruneUnreferencedFiles({
    ...imagePruneConfig,
    getReferenced: async () => [],
    storage,
  });
  await pruneUnreferencedFiles({
    ...attachmentPruneConfig,
    getReferenced: async () => [],
    storage,
  });

  assert.deepEqual(storage.deleted, [`images/${d}.jpg`]);
  assert.ok(
    (storage.listOptions[0] as any).fields.includes('timeCreated'),
    'timeCreated must be requested',
  );
});

test('prune skips the reference lookup for a page without candidates', async () => {
  const storage = createStorage([
    { name: `images/${a}.jpg`, timeCreated: young },
  ]);
  let calls = 0;

  await pruneUnreferencedFiles({
    ...imagePruneConfig,
    getReferenced: async () => {
      calls++;
      return [];
    },
    storage,
  });

  assert.equal(calls, 0);
});
