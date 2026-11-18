import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadOnPreloadError } from './reloadOnPreloadError';

function preloadError(chunk: string) {
  return Object.assign(new Event('vite:preloadError'), {
    payload: new Error(`Failed to fetch dynamically imported module: ${chunk}`),
  });
}

describe('reloadOnPreloadError', () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('location', { reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    reload.mockReset();
  });

  it('reloads when a chunk fails to load', () => {
    reloadOnPreloadError(preloadError('/assets/a.js'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload again when the same chunk still fails after the reload', () => {
    reloadOnPreloadError(preloadError('/assets/a.js'));
    reloadOnPreloadError(preloadError('/assets/a.js'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads when another chunk fails later', () => {
    reloadOnPreloadError(preloadError('/assets/a.js'));
    reloadOnPreloadError(preloadError('/assets/b.js'));
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
