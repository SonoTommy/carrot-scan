import { Plugin } from '../src/plugin-interface.js';
export declare class OsvPlugin extends Plugin {
    static pluginName: string;
    static applies(filePath: any): any;
    run(filePath: any, { content }: {
        content: any;
    }): Promise<any[]>;
}
