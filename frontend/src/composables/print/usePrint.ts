import { useBridgePrint } from './usePrintBridge';
import { useSystemPrint } from './useSystemPrint';

export const PRINT_SERVICE_TYPE_SYSTEM = 'system';
export const PRINT_SERVICE_TYPE_BRIDGE = 'bridge';

const PRINT_SERVICE_URL = import.meta.env.VITE_PRINT_SERVICE_URL;

export type UsePrintResultCommon = {
  print: (str: string) => Promise<void>;
};

export function usePrint() {
  return PRINT_SERVICE_URL
    ? useBridgePrint(PRINT_SERVICE_URL)
    : useSystemPrint();
}
