import { Injectable } from '@angular/core';
import { scan, ScanResult } from '@carrot-scan/core';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarrotScanService {
  scan(
    target: string | string[],
    options?: { mode?: 'fast' | 'complete'; json?: boolean }
  ): Observable<ScanResult> {
    return from(scan(target, options));
  }
}
