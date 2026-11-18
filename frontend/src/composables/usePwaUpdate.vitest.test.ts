import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import type * as Quasar from 'quasar';
import type { QNotifyCreateOptions } from 'quasar';
import { mount } from 'src/utils/testHelpers';
import { usePwaUpdate } from './usePwaUpdate';

const notify = vi.fn<(opts: QNotifyCreateOptions) => void>();

vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal<typeof Quasar>()),
  useQuasar: () => ({ notify }),
}));

class FakeWorker extends EventTarget {
  state: ServiceWorkerState = 'installing';
  postMessage = vi.fn();

  setState(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;

  startInstall() {
    const worker = new FakeWorker();
    this.installing = worker;
    this.dispatchEvent(new Event('updatefound'));
    return worker;
  }

  finishInstall(worker: FakeWorker) {
    this.installing = null;
    this.waiting = worker;
    worker.setState('installed');
  }
}

describe('usePwaUpdate', () => {
  const reload = vi.fn();
  let registration: FakeRegistration;
  let controller: object | null;

  beforeEach(() => {
    registration = new FakeRegistration();
    controller = {};
    vi.stubGlobal('location', { reload });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve(registration),
        get controller() {
          return controller;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    notify.mockReset();
    reload.mockReset();
  });

  async function mountComposable() {
    mount(defineComponent({ template: '<div />', setup: usePwaUpdate }));
    await flushPromises();
  }

  function clickUpdate() {
    const opts = notify.mock.lastCall?.[0];
    const handler = opts?.actions?.[0]?.handler;
    if (!handler) throw new Error('no update notification shown');
    handler();
  }

  function dismissNotification() {
    notify.mock.lastCall?.[0].onDismiss?.();
  }

  it('notifies when an update finishes installing', async () => {
    await mountComposable();
    const worker = registration.startInstall();
    expect(notify).not.toHaveBeenCalled();

    registration.finishInstall(worker);
    expect(notify).toHaveBeenCalledOnce();
  });

  it('notifies about an update that was already waiting on mount', async () => {
    registration.waiting = new FakeWorker();
    await mountComposable();
    expect(notify).toHaveBeenCalledOnce();
  });

  it('notifies about an update that was already installing on mount', async () => {
    const worker = new FakeWorker();
    registration.installing = worker;
    await mountComposable();

    registration.finishInstall(worker);
    expect(notify).toHaveBeenCalledOnce();
  });

  it('does not notify on the first install', async () => {
    controller = null;
    await mountComposable();
    registration.finishInstall(registration.startInstall());
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not notify on mount without a waiting worker', async () => {
    await mountComposable();
    expect(notify).not.toHaveBeenCalled();
  });

  it('shows only one notification while it is open', async () => {
    await mountComposable();
    registration.finishInstall(registration.startInstall());
    registration.finishInstall(registration.startInstall());
    expect(notify).toHaveBeenCalledOnce();
  });

  it('notifies again after the notification was dismissed', async () => {
    await mountComposable();
    registration.finishInstall(registration.startInstall());
    dismissNotification();
    registration.finishInstall(registration.startInstall());
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it('activates the waiting worker and reloads once it is activated', async () => {
    await mountComposable();
    const worker = registration.startInstall();
    registration.finishInstall(worker);

    clickUpdate();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();

    worker.setState('activating');
    expect(reload).not.toHaveBeenCalled();

    worker.setState('activated');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('activates the newest waiting worker', async () => {
    await mountComposable();
    const first = registration.startInstall();
    registration.finishInstall(first);
    const second = registration.startInstall();
    registration.finishInstall(second);

    clickUpdate();
    expect(first.postMessage).not.toHaveBeenCalled();
    expect(second.postMessage).toHaveBeenCalledOnce();
  });

  it('reloads if the waiting worker becomes redundant', async () => {
    await mountComposable();
    const worker = registration.startInstall();
    registration.finishInstall(worker);

    clickUpdate();
    worker.setState('redundant');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads right away if another tab already activated the update', async () => {
    await mountComposable();
    registration.finishInstall(registration.startInstall());
    registration.waiting = null;

    clickUpdate();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does nothing without service worker support', async () => {
    // @ts-expect-error - remove the property to simulate missing support
    delete navigator.serviceWorker;
    await mountComposable();
    await nextTick();
    expect(notify).not.toHaveBeenCalled();
  });
});
