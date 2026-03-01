import { computed, ref } from 'vue';
import { useFetch } from '../useFetch';
import { Notify, Dialog, LocalStorage } from 'quasar';
import { useI18n } from '../useI18n';
import {
  PRINT_SERVICE_TYPE_BRIDGE,
  type UsePrintResultCommon,
} from './usePrint';

const PRINTERS_ENDPOINT = '/printers';
const PRINT_ENDPOINT = '/print';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT_MS = 3000;
const SELECTED_PRINTER_KEY = 'breedersdb-selected-printer-id';
const CACHE_PRINTERS_FOR_MS = 1000;

type Printer = {
  id: string;
  status: string;
  description: string;
  connectionType: string;
};

export function useBridgePrint(url: string): UsePrintResultCommon & {
  type: typeof PRINT_SERVICE_TYPE_BRIDGE;
  selectPrinter: () => Promise<Printer | null>;
} {
  const { fetchWithTimeout } = useFetch();
  const { t } = useI18n();
  const printersCache: { printers: Printer[] | null; timestamp: number } = {
    printers: null,
    timestamp: 0,
  };

  // Initialize from LocalStorage
  const selectedPrinterIdRef = ref<string | null>(
    LocalStorage.has(SELECTED_PRINTER_KEY)
      ? LocalStorage.getItem<string>(SELECTED_PRINTER_KEY) || null
      : null,
  );

  const selectedPrinterId = computed({
    get() {
      return selectedPrinterIdRef.value;
    },
    set(value: string | null) {
      selectedPrinterIdRef.value = value;
      if (value) {
        LocalStorage.set(SELECTED_PRINTER_KEY, value);
      } else {
        LocalStorage.remove(SELECTED_PRINTER_KEY);
      }
    },
  });

  const baseUrl = url.replace(/\/+$/, ''); // remove trailing slashes

  async function getPrinters() {
    const now = Date.now();
    if (
      printersCache.printers &&
      now - printersCache.timestamp < CACHE_PRINTERS_FOR_MS
    ) {
      return printersCache.printers;
    }
    const res = await fetchWithTimeout(baseUrl + PRINTERS_ENDPOINT, {
      timeout: TIMEOUT_MS,
    });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch printers with status ${res.status}: ${await res.text()}`,
      );
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid printers response: expected an array');
    }
    if (
      !data.every(
        (item) =>
          typeof item.id === 'string' && typeof item.status === 'string',
      )
    ) {
      throw new Error(
        'Invalid printers response: each printer must have an id and status string',
      );
    }
    const printers = data as Printer[];
    printersCache.printers = printers;
    printersCache.timestamp = now;
    return printers;
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

  async function getSelectedPrinter(): Promise<Printer | null> {
    const printers = await getPrinters();
    if (selectedPrinterId.value) {
      return printers.find((p) => p.id === selectedPrinterId.value) || null;
    }
    return null;
  }

  async function selectPrinter(): Promise<Printer | null> {
    const printers = await getPrinters();
    if (printers.length === 0) {
      Dialog.create({
        title: t('print.noPrintersAvailable'),
        message: t('print.noPrintersAvailableMessage'),
        ok: true,
      });
      return null;
    }

    let printer = await getSelectedPrinter();

    const choice = await new Promise<string | null>((resolve) => {
      Dialog.create({
        title: t('print.selectPrinter'),
        options: {
          type: 'radio',
          model: printer?.id || '',
          items: printers.map((p) => ({
            label: `${p.id} (${p.status})`,
            value: p.id,
          })),
        },
        cancel: true,
        persistent: true,
      })
        .onOk((printerId) => {
          resolve(printerId);
        })
        .onCancel(() => {
          resolve(null);
        });
    });

    if (!choice) {
      return null;
    }

    printer = printers.find((p) => p.id === choice) || null;

    if (!printer) {
      throw new Error('Printer selection failed');
    }

    selectedPrinterId.value = printer.id;

    return printer;
  }

  async function printWithUserFeedback(str: string) {
    let printer: Printer | null = null;
    try {
      printer = await getSelectedPrinter();
      if (!printer) {
        printer = await selectPrinter();
      }
      if (!printer) {
        return;
      }
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
    type: PRINT_SERVICE_TYPE_BRIDGE,
    print: printWithUserFeedback,
    selectPrinter,
  };
}
