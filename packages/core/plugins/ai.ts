import { Plugin, PluginResult, Severity } from '../src/plugin-interface';
import nlp from 'compromise';

const DANGEROUS_TERMS = [
  'eval',
  'exec',
  'system',
  'include',
  'require',
  'mysqli_query',
  'SELECT',
  'FROM',
  'WHERE',
  'base64_decode',
  'new Function',
  'shell_exec',
  'popen',
  'passthru',
  'proc_open',
  'pcntl_exec',
  'preg_replace',
  'rm -rf',
  'remote-execution',
  'injection',
  'vulnerability',
  'exploit',
  'malware',
  'backdoor',
  'trojan',
  'virus',
  'worm',
  'spyware',
  'adware',
  'ransomware',
  'keylogger',
  'rootkit',
  'botnet',
  'phishing',
  'spam',
  'DDoS',
  'man-in-the-middle',
  'cross-site scripting',
  'XSS',
  'SQL injection',
  'SQLi',
  'command injection',
  'code injection',
  'buffer overflow',
  'denial of service',
  'privilege escalation',
  'directory traversal',
  'file inclusion',
  'arbitrary code execution',
  'remote code execution',
  'RCE',
  'security flaw',
  'security hole',
  'security vulnerability',
  'security bug',
  'security risk',
  'security threat',
  'security issue',
  'security problem',
  'security breach',
  'security incident',
  'security violation',
  'security compromise',
  'security attack',
  'security exploit',
  'security vulnerability',
];

export class AiPlugin extends Plugin {
  static pluginName = 'ai';

  static applies(): boolean {
    return true;
  }

  async run(filePath: string, { content }: { content: string }): Promise<PluginResult[]> {
    const messages: PluginResult[] = [];
    // @ts-ignore
    const doc = nlp(content);
    const terms = doc.terms().out('array');

    for (const term of terms) {
      if (DANGEROUS_TERMS.includes(term.toLowerCase())) {
        messages.push({
          pluginName: (this.constructor as typeof Plugin).pluginName,
          filePath,
          line: 0, // compromise doesn't provide line numbers
          column: 0,
          severity: 'warning',
          message: `Potentially dangerous term found: ${term}`,
        });
      }
    }
    return messages;
  }
}