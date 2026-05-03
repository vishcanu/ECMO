import type { PhysiologyContext, SimulationDelta } from '../../types';

/**
 * Ventilator Engine — ARDSNet / ARDS Foundation-based ventilator effects
 */
export function calculateVentilatorEffects(ctx: PhysiologyContext): SimulationDelta {
  const { ventilator } = ctx.devices;
  const delta: SimulationDelta = { vitals: {}, waveforms: {}, labs: {} };

  if (!ventilator.enabled) return delta;

  const { fio2, tidalVolume, peep, respiratoryRate } = ventilator;
  const weight = ctx.demographics.weight || 70;

  // ─── Oxygenation effect (simplified Fick/shunt model) ────────────────────
  // FiO2 drives SpO2: higher FiO2 → better SpO2
  const fio2SpO2Gain = (fio2 - 0.21) * 40; // Max ~32% gain at FiO2=1.0
  const peepSpO2Gain = (peep / 10) * 5;    // PEEP improves recruitment

  // ─── CO2 removal (MV = TV × RR) ─────────────────────────────────────────
  const minuteVentilation = (tidalVolume / 1000) * respiratoryRate; // L/min
  // Baseline MV ~6 L/min removes 200 mL CO2/min → PaCO2 ~40
  // Changes in MV inversely affect PaCO2
  const co2Effect = ((minuteVentilation - 6) / 6) * (-8); // mmHg change in etCO2

  // ─── Airway pressure effects ─────────────────────────────────────────────
  // High PIP → can cause hemodynamic compromise (PPV effect)
  const mlPerKg = tidalVolume / weight;
  const barotraumaRisk = mlPerKg > 8 ? (mlPerKg - 8) * 2 : 0;
  const sbpReduction = barotraumaRisk; // high TV → slight BP reduction

  delta.vitals = {
    spo2: fio2SpO2Gain + peepSpO2Gain,
    rr: 0, // RR is set by machine
    sbp: -sbpReduction,
    etco2: co2Effect,
    // pip and peep are the user's authored scenario values — do not override as deltas
  };

  return delta;
}
