import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleUpdateChecks } from './scheduleUpdateChecks';

const MINUTE = 60_000;

describe('scheduleUpdateChecks', () => {
  const update = vi.fn();
  const registration = { update } as unknown as ServiceWorkerRegistration;
  let visibilityState: DocumentVisibilityState;

  function setVisibility(state: DocumentVisibilityState) {
    visibilityState = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    update.mockResolvedValue(undefined);
    visibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibilityState,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    update.mockReset();
  });

  // each test adds a visibilitychange listener to the shared document, so
  // collect them to keep the tests independent
  const listeners: EventListener[] = [];
  beforeEach(() => {
    const add = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.push(listener as EventListener);
        add(type, listener);
      },
    );
  });
  afterEach(() => {
    listeners.forEach((l) =>
      document.removeEventListener('visibilitychange', l),
    );
    listeners.length = 0;
  });

  it('checks for updates every hour', () => {
    scheduleUpdateChecks(registration);
    vi.advanceTimersByTime(59 * MINUTE);
    expect(update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(MINUTE);
    expect(update).toHaveBeenCalledOnce();
  });

  it('checks when the app becomes visible after more than 10 minutes', () => {
    scheduleUpdateChecks(registration);
    setVisibility('hidden');
    vi.advanceTimersByTime(11 * MINUTE);
    setVisibility('visible');
    expect(update).toHaveBeenCalledOnce();
  });

  it('does not check when the app becomes visible within 10 minutes', () => {
    scheduleUpdateChecks(registration);
    setVisibility('hidden');
    vi.advanceTimersByTime(9 * MINUTE);
    setVisibility('visible');
    expect(update).not.toHaveBeenCalled();
  });

  it('does not check when the app becomes hidden', () => {
    scheduleUpdateChecks(registration);
    vi.advanceTimersByTime(11 * MINUTE);
    setVisibility('hidden');
    expect(update).not.toHaveBeenCalled();
  });

  it('counts the hourly check as the last check', () => {
    scheduleUpdateChecks(registration);
    vi.advanceTimersByTime(60 * MINUTE);
    setVisibility('hidden');
    vi.advanceTimersByTime(5 * MINUTE);
    setVisibility('visible');
    expect(update).toHaveBeenCalledOnce();
  });

  it('logs failed checks instead of throwing', async () => {
    const error = new Error('offline');
    update.mockRejectedValue(error);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    scheduleUpdateChecks(registration);
    await vi.advanceTimersByTimeAsync(60 * MINUTE);

    expect(warn).toHaveBeenCalledWith(
      'Service worker update check failed:',
      error,
    );
  });
});
