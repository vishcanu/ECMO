type AlarmLevel = 'high' | 'low' | 'critical' | null;

interface AlarmThreshold {
  criticalHigh?: number;
  high?: number;
  low?: number;
  criticalLow?: number;
}

const THRESHOLDS: Record<string, AlarmThreshold> = {
  hr: { criticalHigh: 160, high: 130, low: 40, criticalLow: 30 },
  map: { criticalHigh: 150, high: 110, low: 60, criticalLow: 50 },
  sbp: { criticalHigh: 200, high: 170, low: 80, criticalLow: 60 },
  spo2: { low: 92, criticalLow: 85 },
  rr: { criticalHigh: 40, high: 30, low: 6, criticalLow: 4 },
  temperature: { criticalHigh: 40.5, high: 39, low: 35, criticalLow: 34 },
  cvp: { high: 20, low: 2 },
  pap_mean: { criticalHigh: 55, high: 40, low: 8 },
  etco2: { criticalHigh: 60, high: 50, low: 25, criticalLow: 15 },
};

export function getVitalAlarm(key: string, value: number): AlarmLevel {
  const t = THRESHOLDS[key];
  if (!t) return null;

  if (t.criticalHigh !== undefined && value >= t.criticalHigh) return 'critical';
  if (t.criticalLow !== undefined && value <= t.criticalLow) return 'critical';
  if (t.high !== undefined && value > t.high) return 'high';
  if (t.low !== undefined && value < t.low) return 'low';
  return null;
}
