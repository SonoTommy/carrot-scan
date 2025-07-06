import { Plugin } from '../src/plugin-interface.js';
export declare class XrayPlugin extends Plugin {
    static pluginName: string;
    static applies(filePath: any): boolean;
    run(filePath: any, _content: any): Promise<{
        pluginName: any;
        filePath: any;
        line: any;
        column: any;
        severity: string;
        message: any;
    }[]>;
}
