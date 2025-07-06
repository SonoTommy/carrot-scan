import { Plugin } from '../src/plugin-interface';
import fs from 'fs/promises';
import path from 'path';

export class DockerfilePlugin extends Plugin {
  static applies(file: string): boolean {
    return path.basename(file).toLowerCase() === 'dockerfile';
  }

  async run(file: string, context: { content: string }): Promise<any[]> {
    const issues: any[] = [];
    const content = context.content;
    const lines = content.split('\n');

    // Check that FROM is the first instruction
    if (!lines[0].trim().toUpperCase().startsWith('FROM')) {
      issues.push({
        file,
        line: 1,
        message: 'Dockerfile should start with a FROM instruction.',
        pluginName: DockerfilePlugin.pluginName,
      });
    }

    // Check that a user is set and it is not root
    let userSet = false;
    for (const line of lines) {
      if (line.trim().toUpperCase().startsWith('USER')) {
        userSet = true;
        if (line.trim().split(/\s+/)[1] === 'root') {
          issues.push({
            file,
            line: lines.indexOf(line) + 1,
            message: 'Avoid running containers as root user.',
            pluginName: DockerfilePlugin.pluginName,
          });
        }
      }
    }
    if (!userSet) {
      issues.push({
        file,
        line: 1,
        message: 'A user should be set in the Dockerfile.',
        pluginName: DockerfilePlugin.pluginName,
      });
    }

    // Check that no ADD commands are used
    for (const line of lines) {
      if (line.trim().toUpperCase().startsWith('ADD')) {
        issues.push({
          file,
          line: lines.indexOf(line) + 1,
          message: 'Use COPY instead of ADD.',
          pluginName: DockerfilePlugin.pluginName,
        });
      }
    }

    // Check that no secrets are leaked
    for (const line of lines) {
      if (line.match(/password|secret|token/i)) {
        issues.push({
          file,
          line: lines.indexOf(line) + 1,
          message: 'Potential secret leak.',
          pluginName: DockerfilePlugin.pluginName,
        });
      }
    }

    // Check that a HEALTHCHECK is defined
    let healthcheckSet = false;
    for (const line of lines) {
      if (line.trim().toUpperCase().startsWith('HEALTHCHECK')) {
        healthcheckSet = true;
      }
    }
    if (!healthcheckSet) {
      issues.push({
        file,
        line: 1,
        message: 'A HEALTHCHECK should be defined.',
        pluginName: DockerfilePlugin.pluginName,
      });
    }

    // Check that a .dockerignore file is present
    const dockerignorePath = path.join(path.dirname(file), '.dockerignore');
    try {
      await fs.access(dockerignorePath);
    } catch {
      issues.push({
        file,
        line: 1,
        message: 'A .dockerignore file should be present.',
        pluginName: DockerfilePlugin.pluginName,
      });
    }

    return issues;
  }
}