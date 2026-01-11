import { onBeforeUnmount } from 'vue';
import { useFetch } from './useFetch';
import { Notify, Dialog, SessionStorage } from 'quasar';
import { useI18n } from './useI18n';

const PRINT_SERVICE_URL = import.meta.env.VITE_PRINT_SERVICE_URL;
const PRINTERS_ENDPOINT = '/printers';
const PRINT_ENDPOINT = '/print';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT_MS = 3000;
const SELECTED_PRINTER_KEY = 'breedersdb-selected-printer-id';

const PASSTHROUGH_MARKER_TEMPLATE = '${%s}$';

type Printer = {
  id: string;
  status: string;
  description: string;
  connectionType: string;
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

  async function print(str: string, printerId: string) {
    const resp = await fetchWithTimeout(baseUrl + PRINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Printer-Id': printerId,
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

  async function selectPrinter(): Promise<Printer | null> {
    const printers = await getPrinters();
    if (printers.length === 0) {
      throw new Error('No printers available');
    }
    if (printers.length === 1) {
      return printers.pop() as Printer;
    }
    if (SessionStorage.has(SELECTED_PRINTER_KEY)) {
      const storedId = SessionStorage.getItem<string>(SELECTED_PRINTER_KEY);
      const storedPrinter = printers.find((p) => p.id === storedId);
      if (storedPrinter) {
        return storedPrinter;
      }
    }

    const choice = await new Promise<string | null>((resolve) => {
      Dialog.create({
        title: t('print.selectPrinter'),
        options: {
          type: 'radio',
          model: 'printerId',
          items: printers.map((p) => ({
            label: `${p.id} (${p.status})`,
            value: p.id,
          })),
        },
        cancel: true,
        persistent: true,
      })
        .onOk((data) => {
          resolve(data);
        })
        .onCancel(() => {
          resolve(null);
        });
    });

    const printer = printers.find((p) => p.id === choice) || null;

    if (!printer) {
      throw new Error('Printer selection failed');
    }

    SessionStorage.set(SELECTED_PRINTER_KEY, printer.id);

    return printer;
  }

  async function printWithUserFeedback(str: string) {
    let printer: Printer | null = null;
    try {
      printer = await selectPrinter();
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: t('print.failure', {
          error: error instanceof Error ? error.message : String(error),
        }),
      });
      return;
    }

    if (!printer) {
      return;
    }

    try {
      await print(str, printer.id);
      Notify.create({
        type: 'positive',
        message: t('print.success', { printer: printer.id }),
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
