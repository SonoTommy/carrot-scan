declare module './plugin-manager.js' {
  export function listPlugins(): Promise<any[]>;
  export function enablePlugin(pluginName: string): Promise<void>;
  export function disablePlugin(pluginName: string): Promise<void>;
  export function createPlugin(pluginName: string): Promise<void>;
}