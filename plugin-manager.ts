import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface PluginConfig {
  enabled: boolean;
}

interface CarrotScanConfig {
  plugins: Record<string, PluginConfig>;
}

const PLUGINS_DIR = path.join(process.cwd(), 'packages/core/plugins');
const CONFIG_PATH = path.join(process.cwd(), 'carrot-scan.config.ts');

async function readConfig(): Promise<CarrotScanConfig | null> {
  try {
    const { default: config } = await import(CONFIG_PATH);
    return config;
  } catch (error: any) {
    console.error(chalk.red(`Error reading config file: ${error.message}`));
    return null;
  }
}

async function writeConfig(config: CarrotScanConfig): Promise<void> {
  try {
    const content = `export default ${JSON.stringify(config, null, 2)};`;
    await fs.writeFile(CONFIG_PATH, content);
  } catch (error: any) {
    console.error(chalk.red(`Error writing config file: ${error.message}`));
  }
}

export async function listPlugins(): Promise<{ name: string; enabled: boolean }[]> {
  try {
    const files = await fs.readdir(PLUGINS_DIR);
    const pluginFiles = files.filter(file => file.endsWith('.ts') && file !== 'template.ts');
    const config = await readConfig();

    if (!config || !config.plugins) {
      return [];
    }
    
    if (pluginFiles.length === 0) {
      return [];
    }

    return pluginFiles.map(file => {
      const pluginName = file.replace('.ts', '');
      const enabled = config.plugins[pluginName]?.enabled || false;
      return { name: pluginName, enabled };
    });
  } catch (error: any) {
    console.error(chalk.red(`Error listing plugins: ${error.message}`));
    return [];
  }
}

export async function enablePlugin(pluginName: string): Promise<void> {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    return;
  }

  config.plugins[pluginName].enabled = true;
  await writeConfig(config);
}

export async function disablePlugin(pluginName: string): Promise<void> {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    return;
  }

  config.plugins[pluginName].enabled = false;
  await writeConfig(config);
}

export async function createPlugin(pluginName: string): Promise<void> {
  const templatePath = path.join(PLUGINS_DIR, 'template.ts');
  const newPluginPath = path.join(PLUGINS_DIR, `${pluginName}.ts`);

  try {
    await fs.copyFile(templatePath, newPluginPath);
    console.log(chalk.green(`Plugin '${pluginName}.ts' created successfully from template.`));

    // Add new plugin to config as enabled by default
    const config = await readConfig();
    if (config) {
      config.plugins[pluginName] = { enabled: true };
      await writeConfig(config);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error creating plugin '${pluginName}': ${error.message}`));
  }
}