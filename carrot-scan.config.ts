interface PluginConfig {
  enabled: boolean;
}

interface WeightsConfig {
  eslint?: number;
  xray?: number;
  audit?: number;
  ai?: number;
  osv?: number;
  critical?: number;
  complexity?: number;
  semgrep?: number;
  heuristic?: number;
  dockerfile?: number;
}

interface ThresholdsConfig {
  complexity?: number;
}

interface CarrotScanConfig {
  weights: WeightsConfig;
  thresholds: ThresholdsConfig;
  plugins: Record<string, PluginConfig>;
}

const config: CarrotScanConfig = {
  weights: {
    eslint: 1.5,
    xray: 10,
    audit: 5,
    ai: 8,
    osv: 10,
  },
  thresholds: {
    complexity: 12,
  },
  plugins: {
    semgrep: { enabled: true },
    audit: { enabled: true },
    complexity: { enabled: true },
    critical: { enabled: true },
    eslint: { enabled: true },
    heuristic: { enabled: true },
    xray: { enabled: true },
    ai: { enabled: true },
    osv: { enabled: true },
  },
};

export default config;