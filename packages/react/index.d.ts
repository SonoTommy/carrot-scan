import { ScanResult } from '@carrot-scan/core';

export function useCarrotScan(
  target: string | string[],
  options?: { mode?: 'fast' | 'complete'; json?: boolean }
): { result: ScanResult | null; error: Error | null; loading: boolean };
