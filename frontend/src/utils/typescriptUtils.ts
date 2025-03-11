/**
 * Omit a property from all interfaces in a union, but keep the union structure
 *
 * @see https://stackoverflow.com/a/57103940
 */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export type Unpack<T> = {
  [K in keyof T]: T[K] extends object ? Unpack<T[K]> : T[K];
};

/**
 * Set all values of type `undefined` to `null`
 *
 * Examples:
 * ```
 * - { a: undefined } -> { a: null }
 * - { a?: undefined } -> { a?: null }
 * - { a?: null | undefined } -> { a?: null }
 * - { a?: string | null | undefined } -> { a?: string | null }
 * ```
 */
export type UndefinedToNull<T> = {
  [P in keyof T]: T[P] extends undefined ? null : NonNullable<T[P]> | null;
};

/**
 * Like `Partial`, but also allows `undefined` values
 *
 * Example:
 * ```
 * { a: 1 } -> { a?: 1 | undefined }
 * ```
 */
export type PartialWithUndefined<T> = {
  [P in keyof T]?: T[P] | undefined;
};
