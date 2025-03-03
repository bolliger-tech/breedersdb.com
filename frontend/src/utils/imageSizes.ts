// ⚠ must correspond to /cloud-function/src/images/cache.ts
// images of different sizes won't be cached
export const imageSizes = {
  w282: { width: 282, height: null },
  w564: { width: 564, height: null },
  w320: { width: 320, height: null },
  w768: { width: 768, height: null },
  w1024: { width: 1024, height: null },
  w2560: { width: 2560, height: null },
  w3840: { width: 3840, height: null },
  h200: { width: null, height: 200 },
  h400: { width: null, height: 400 },
  h800: { width: null, height: 800 },
} as const;

export type AllowedImageSizes = (typeof imageSizes)[keyof typeof imageSizes];
