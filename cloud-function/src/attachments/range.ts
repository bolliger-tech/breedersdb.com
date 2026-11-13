const RANGE_REGEX = /^bytes=(\d*)-(\d*)$/;

/**
 * Parses a single byte range of a Range header (RFC 9110).
 *
 * @returns undefined if the whole file should be sent (no, invalid or multiple ranges)
 */
export function parseRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | 'unsatisfiable' | undefined {
  const match = header?.match(RANGE_REGEX);
  if (!match) {
    return undefined;
  }

  const [, first, last] = match;

  // suffix range: the last n bytes
  if (!first) {
    if (!last) {
      return undefined;
    }
    const suffixLength = Number(last);
    if (suffixLength === 0) {
      return 'unsatisfiable';
    }
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(first);
  if (last && Number(last) < start) {
    return undefined;
  }
  if (start >= size) {
    return 'unsatisfiable';
  }
  return { start, end: last ? Math.min(Number(last), size - 1) : size - 1 };
}
