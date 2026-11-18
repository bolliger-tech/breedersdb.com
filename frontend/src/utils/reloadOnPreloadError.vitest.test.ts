import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadOnPreloadError } from './reloadOnPreloadError';

describe('reloadOnPreloadError', () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    vi.stubGlobal('location', { reload });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    reload.mockReset();
  });

  it('reloads on the first preload error', () => {
    reloadOnPreloadError();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload again right after a reload', () => {
    reloadOnPreloadError();
    vi.advanceTimersByTime(9_000);
    reloadOnPreloadError();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads again once the interval has passed', () => {
    reloadOnPreloadError();
    vi.advanceTimersByTime(11_000);
    reloadOnPreloadError();
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
