import { Plugin } from '../src/plugin-interface.js';
export declare class AuditPlugin extends Plugin {
    static pluginName: string;
    static applies(filePath: any): boolean;
    run(_filePath: any, { target }: {
        target: any;
    }): Promise<{
        pluginName: any;
        filePath: any;
        line: number;
        column: number;
        severity: string;
        message: string;
    }[]>;
}
