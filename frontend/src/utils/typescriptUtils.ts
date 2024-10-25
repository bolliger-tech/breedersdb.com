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
