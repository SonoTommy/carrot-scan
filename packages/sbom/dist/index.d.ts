#!/usr/bin/env node
export interface SBOMOpts {
    format: 'cyclonedx' | 'sarif';
    includeDev?: boolean;
    output?: string;
}
export declare function generateSBOM(project?: string, opts?: SBOMOpts): Promise<void>;
