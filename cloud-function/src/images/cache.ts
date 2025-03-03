import type { CacheConfig } from '../lib/image';

// prefix corresponds to a bucket lifecycle rule
// that deletes files after some time.
// see deployment for details.
const CACHE_PREFIX = 'cached-';

export const FILE_NAME_REGEX = new RegExp(
  `^(?:${CACHE_PREFIX})?(\\w+)(?:-\\d+x\\d+)?\\.(\\w+)$`,
);

export const imageCacheConfig: CacheConfig = {
  allowedDimensions: [
    // ⚠ must correspond to /frontend/src/utils/imageSizes.ts
    // images of different sizes won't be cached
    //
    // `null` means "keep aspect ratio"
    { width: 282, height: null },
    { width: 564, height: null },
    { width: 320, height: null },
    { width: 768, height: null },
    { width: 1024, height: null },
    { width: 2560, height: null },
    { width: 3840, height: null },
    { width: null, height: 200 },
    { width: null, height: 400 },
    { width: null, height: 800 },
  ],
  prefix: CACHE_PREFIX,
};
