export default {
  weights: {
    eslint: 1.5,
    xray: 10,
    audit: 5,
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
  },
};
