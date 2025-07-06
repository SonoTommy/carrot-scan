import { Plugin } from '../src/plugin-interface.js';
export declare class ComplexityPlugin extends Plugin {
    static pluginName: string;
    static applies(file: any): boolean;
    run(filePath: any, { content }: {
        content: any;
    }): Promise<{
        pluginName: any;
        filePath: any;
        line: any;
        column: number;
        severity: string;
        message: string;
    }[]>;
}
