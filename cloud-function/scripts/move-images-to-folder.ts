// Moves the images from the bucket root into images/ and deletes the resized
// images at the root (cached-*), which are regenerated on demand in cache/images/.
// Files at the root that are neither are left untouched and reported.
//
// Idempotent: run it again after deploying to move images uploaded meanwhile.
//
// Usage (reads the GOOGLE_* storage variables from the env or .env):
//   npm run build && node scripts/move-images-to-folder.ts

import 'dotenv/config';
import type { File } from '@google-cloud/storage';
import { getFiles } from '../dist/lib/storage.js';
import {
  IMAGE_FILE_NAME_REGEX,
  IMAGE_STORAGE_PREFIX,
} from '../dist/images/fileName.js';

const OLD_CACHE_PREFIX = 'cached-';
const PARALLEL = 20;

// the delimiter limits the listing to the bucket root
const [files] = (await getFiles({ delimiter: '/' })) as [File[]];

let moved = 0;
let deleted = 0;
const skipped: string[] = [];

for (let i = 0; i < files.length; i += PARALLEL) {
  await Promise.all(
    files.slice(i, i + PARALLEL).map(async (file) => {
      if (IMAGE_FILE_NAME_REGEX.test(file.name)) {
        await file.move(IMAGE_STORAGE_PREFIX + file.name);
        moved++;
      } else if (file.name.startsWith(OLD_CACHE_PREFIX)) {
        await file.delete();
        deleted++;
      } else {
        skipped.push(file.name);
      }
    }),
  );
  console.log(
    `Processed ${Math.min(i + PARALLEL, files.length)}/${files.length}`,
  );
}

console.log(`Moved ${moved} images to ${IMAGE_STORAGE_PREFIX}`);
console.log(`Deleted ${deleted} resized images (${OLD_CACHE_PREFIX}*)`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} unknown files:`, skipped);
}
