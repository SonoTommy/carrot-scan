import { Plugin } from '../src/plugin-interface.ts';
export declare class DockerfilePlugin extends Plugin {
    static applies(file: string): boolean;
    run(file: string, context: {
        content: string;
    }): Promise<any[]>;
}
