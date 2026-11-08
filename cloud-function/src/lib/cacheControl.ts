import * as ff from '@google-cloud/functions-framework';

/**
 * For content-addressed assets, which never change.
 */
export function setImmutableCacheControl(res: ff.Response) {
  // https://cloud.google.com/cdn/docs/caching#expiration
  // > By default, when the expiration time value exceeds 30 days (2,592,000 seconds),
  //   Cloud CDN treats the expiration valueas if it were 2,592,000 seconds.
  // > As an upper bound, cache entries that aren't accessed for 30 days are automatically evicted.
  // => We still set max-age to 1 year to allow for longer caching in the browser
  res.setHeader(
    'Cache-Control',
    `max-age=${60 * 60 * 24 * 365},public,immutable`,
  ); // 1 year
}
