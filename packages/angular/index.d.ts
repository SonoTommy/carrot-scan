import { Observable } from 'rxjs';
import { ScanResult } from '@carrot-scan/core';

export declare class CarrotScanService {
  scan(
    target: string | string[],
    options?: {
      mode?: 'fast' | 'complete';
      json?: boolean;
    }
  ): Observable<ScanResult>;
}
