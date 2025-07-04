import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const PLUGINS_DIR = path.join(process.cwd(), 'plugins');
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
      console.log(chalk.yellow('Configuration not found or invalid.'));
      return;
    }
    
    if (pluginFiles.length === 0) {
      console.log(chalk.yellow('No plugins found.'));
      return;
    }

    console.log(chalk.bold('Available Plugins:'));
    for (const file of pluginFiles) {
      const pluginName = file.replace('.js', '');
      const status = config.plugins[pluginName]?.enabled ? chalk.green('(enabled)') : chalk.red('(disabled)');
      console.log(`- ${pluginName} ${status}`);
    }
  } catch (error) {
    console.error(chalk.red(`Error listing plugins: ${error.message}`));
  }
}

export async function enablePlugin(pluginName) {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    console.log(chalk.red(`Plugin '${pluginName}' not found in configuration.`));
    return;
  }

  config.plugins[pluginName].enabled = true;
  await writeConfig(config);
  console.log(chalk.green(`Plugin '${pluginName}' enabled.`));
}

export async function disablePlugin(pluginName) {
  const config = await readConfig();
  if (!config) return;

  if (!config.plugins[pluginName]) {
    console.log(chalk.red(`Plugin '${pluginName}' not found in configuration.`));
    return;
  }

  config.plugins[pluginName].enabled = false;
  await writeConfig(config);
  console.log(chalk.yellow(`Plugin '${pluginName}' disabled.`));
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
