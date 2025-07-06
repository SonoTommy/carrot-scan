import { Plugin } from '../src/plugin-interface.js';
export declare class ESLintPlugin extends Plugin {
    static pluginName: string;
    static applies(file: any): boolean;
    run(filePath: any, { content }: {
        content: any;
    }): Promise<{
        pluginName: any;
        filePath: any;
        line: number;
        column: number;
        severity: string;
        message: string;
    }[]>;
}
