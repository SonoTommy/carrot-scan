import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const PLUGINS_DIR = path.join(process.cwd(), 'packages/core/plugins');
const CONFIG_PATH = path.join(process.cwd(), 'carrot-scan.config.js');

async function readConfig() {
  try {
    const { default: config } = await import(CONFIG_PATH);
    return config;
  } catch (error) {
    console.error(chalk.red(`Error reading config file: ${error.message}`));
    return null;
  }
}

async function writeConfig(config) {
  try {
    const content = `export default ${JSON.stringify(config, null, 2)};`;
    await fs.writeFile(CONFIG_PATH, content);
  } catch (error) {
    console.error(chalk.red(`Error writing config file: ${error.message}`));
  }
}

export async function listPlugins() {
  try {
    const files = await fs.readdir(PLUGINS_DIR);
    const pluginFiles = files.filter(file => file.endsWith('.js') && file !== 'template.js');
    const config = await readConfig();

    if (!config || !config.plugins) {
      return [];
    }
    
    if (pluginFiles.length === 0) {
      return [];
    }

    return pluginFiles.map(file => {
      const pluginName = file.replace('.js', '');
      const enabled = config.plugins[pluginName]?.enabled || false;
      return { name: pluginName, enabled };
    });
  } catch (error) {
    console.error(chalk.red(`Error listing plugins: ${error.message}`));
    return [];
  }
}

export async function enablePlugin(pluginName) {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    return;
  }

  config.plugins[pluginName].enabled = true;
  await writeConfig(config);
}

export async function disablePlugin(pluginName) {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    return;
  }

  config.plugins[pluginName].enabled = false;
  await writeConfig(config);
}

export async function createPlugin(pluginName) {
  const templatePath = path.join(PLUGINS_DIR, 'template.js');
  const newPluginPath = path.join(PLUGINS_DIR, `${pluginName}.js`);

  try {
    await fs.copyFile(templatePath, newPluginPath);
    console.log(chalk.green(`Plugin '${pluginName}.js' created successfully from template.`));

    // Add new plugin to config as enabled by default
    const config = await readConfig();
    if (config) {
      config.plugins[pluginName] = { enabled: true };
      await writeConfig(config);
    }
  } catch (error) {
    console.error(chalk.red(`Error creating plugin '${pluginName}': ${error.message}`));
  }
}
