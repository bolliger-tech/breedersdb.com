import { onBeforeUnmount } from 'vue';
import { useFetch } from './useFetch';
import { Notify } from 'quasar';
import { useI18n } from './useI18n';

const PRINT_SERVICE_URL = import.meta.env.VITE_PRINT_SERVICE_URL;
const PRINTERS_ENDPOINT = '/printers';
const PRINT_ENDPOINT = '/print';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT_MS = 3000;

const PASSTHROUGH_MARKER_TEMPLATE = '${%s}$';

type Printer = {
  id: string;
  name: string;
  type: 'driver' | 'serial';
  path: string;
  baud?: number | undefined | null;
};

export function usePrint() {
  const { print } = PRINT_SERVICE_URL
    ? useBridgePrint(PRINT_SERVICE_URL)
    : useSystemPrint();

  return {
    print,
  };
}

function useSystemPrint() {
  let frame: HTMLIFrameElement | null = null;

  function removeFrame() {
    if (frame) {
      document.body.removeChild(frame);
      frame = null;
    }
  }

  function print(str: string) {
    if (frame) document.body.removeChild(frame);
    const content =
      encodeURIComponent('<html><head>') +
      '%3Cscript%3E' + // script tag. vue parser fails if not encoded here
      encodeURIComponent(
        // !!! DO NOT CHANGE !!!
        // or you will have to adapt the CSP hash
        // see dev-nginx.conf AND deployment repo
        'window.onload = () => { console.info("print", document.body.textContent); window.print(); }',
      ) +
      '%3C%2Fscript%3E' + // /script tag. vue parser fails if not encoded here
      encodeURIComponent('</head><body>') +
      encodeURIComponent(wrapPassthroughMarker(str)) +
      encodeURIComponent('</body></html>');
    frame = document.body.appendChild(document.createElement('iframe'));
    frame.style.display = 'none';
    frame.src = 'data:text/html;charset=utf-8,' + content;
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        removeFrame();
        resolve();
      }, 1000);
    });
  }

  onBeforeUnmount(removeFrame);

  return {
    print,
  };
}

function wrapPassthroughMarker(str: string) {
  return PASSTHROUGH_MARKER_TEMPLATE.replace('%s', str);
}

function useBridgePrint(url: string) {
  const { fetchWithTimeout } = useFetch();
  const { t } = useI18n();

  const baseUrl = url.replace(/\/+$/, ''); // remove trailing slashes

  async function getPrinters() {
    const res = await fetchWithTimeout(baseUrl + PRINTERS_ENDPOINT, {
      timeout: TIMEOUT_MS,
    });
    return res.json() as Promise<Printer[]>;
  }

  async function print(str: string) {
    const firstDriverPrinter = (await getPrinters()).find(
      (p) => p.type === 'driver',
    );
    if (!firstDriverPrinter) {
      throw new Error('No printer available of type driver found');
    }

    const resp = await fetchWithTimeout(baseUrl + PRINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Printer-Id': firstDriverPrinter.id,
      },
      body: str,
      timeout: TIMEOUT_MS,
    });

    if (!resp.ok) {
      throw new Error(
        `Print request failed with status ${resp.status}: ${await resp.text()}`,
      );
    }
  }

  async function bridgeIsHealthy() {
    try {
      const resp = await fetchWithTimeout(baseUrl + HEALTH_ENDPOINT, {
        timeout: TIMEOUT_MS,
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async function printWithUserFeedback(str: string) {
    try {
      await print(str);
      Notify.create({
        type: 'positive',
        message: t('print.success'),
      });
    } catch (error) {
      const healthy = await bridgeIsHealthy();
      if (!healthy) {
        Notify.create({
          type: 'negative',
          message: t('print.serviceUnreachable'),
        });
        return;
      }
      Notify.create({
        type: 'negative',
        message: t('print.failure', {
          error: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  }

  return {
    print: printWithUserFeedback,
  };
}
