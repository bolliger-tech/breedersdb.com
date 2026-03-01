import { onBeforeUnmount } from 'vue';

const DEFAULT_TIMEOUT = 10000;

export function useFetch() {
  const timers = new Set<NodeJS.Timeout>();

  function registerTimeout(fn: () => void, delay: number) {
    const timer = setTimeout(fn, delay);
    timers.add(timer);
    return timer;
  }

  function removeTimeout(timer: NodeJS.Timeout) {
    clearTimeout(timer);
    timers.delete(timer);
  }

  async function fetchWithTimeout(
    url: string,
    options?: RequestInit & { timeout?: number },
  ): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT } = options ?? {};

    const controller = new AbortController();
    const timer = registerTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      removeTimeout(timer);
    }
    return response;
  }

  onBeforeUnmount(() => timers.forEach((timer) => clearTimeout(timer)));

  return {
    fetchWithTimeout,
  };
}
