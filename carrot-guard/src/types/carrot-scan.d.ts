declare module 'carrot-scan' {
  export type Severity = 'error' | 'warning' | 'info';

  export interface ScanOptions {
    mode?: 'fast' | 'complete';
    stream?: boolean;
  }

  export interface ScanMessage {
    line?: number;
    column?: number;
    severity: Severity;
    message: string;
    patch?: string;
  }

  export interface ScanResult {
    score: number;      // es. 82
    rating: string;     // es. "B+"
    messages?: ScanMessage[];
  }

  export function scan(
    targetPath: string,
    opts?: ScanOptions
  ): Promise<ScanResult>;
}