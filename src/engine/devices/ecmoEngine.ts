import type { PhysiologyContext, SimulationDelta, WaveformConfig } from '../../types';

/**
 * ECMO Engine — ELSO/EOLIA-based physiological effects
 *
 * VV-ECMO: Improves oxygenation and CO2 removal, minimal hemodynamic effect
 * VA-ECMO: Provides cardiac output support + oxygenation
 */
export function calculateECMOEffects(ctx: PhysiologyContext): SimulationDelta {
  const { ecmo } = ctx.devices;
  const delta: SimulationDelta = { vitals: {}, waveforms: {}, labs: {} };

  if (!ecmo.enabled) return delta;

  const { flow, sweepGas, fio2Ecmo, mode } = ecmo;

  // ─── VV-ECMO ─────────────────────────────────────────────────────────────
  if (mode === 'VV') {
    // Oxygenation effect: flow-dependent SpO2 improvement
    // Per ELSO guidelines: 4–5 L/min flow → near-normal oxygenation
    const flowFactor = Math.min(flow / 5.0, 1.0);
    const spo2Gain = flowFactor * fio2Ecmo * 15; // up to +15%

    // CO2 removal: primarily sweep gas dependent
    // Sweep 4 L/min reduces PaCO2 by ~20 mmHg
    const co2Reduction = (sweepGas / 10) * 20;

    delta.vitals = {
      spo2: spo2Gain,
      // RR compensation: as CO2 clears, drive reduces
      rr: -(co2Reduction / 20) * 3,
    };

    // SpO2 pleth amplitude improves with ECMO
    delta.waveforms = {
      spo2Pleth: {
        amplitude: Math.min(80 + flowFactor * 20, 100),
      },
    };
  }

  // ─── VA-ECMO ─────────────────────────────────────────────────────────────
  if (mode === 'VA') {
    const flowFactor = Math.min(flow / 5.0, 1.0);
    const spo2Gain = flowFactor * fio2Ecmo * 18;

    // Hemodynamic support: VA-ECMO provides cardiac output
    const sbpGain = flowFactor * 30;
    const dbpGain = flowFactor * 15;

    delta.vitals = {
      spo2: spo2Gain,
      sbp: sbpGain,
      dbp: dbpGain,
      // map omitted — recomputed in simulationEngine Step 6
    };

    delta.waveforms = {
      arterialLine: {
        dicroticNotch: flow < 3,
        damping: flow > 4 ? 'over' : 'normal',
        respiratoryVariation: 2,
      },
      spo2Pleth: {
        amplitude: Math.min(60 + flowFactor * 30, 100),
      },
    } as Partial<WaveformConfig>;
  }

  // ─── VAV-ECMO ────────────────────────────────────────────────────────────
  if (mode === 'VAV') {
    const flowFactor = Math.min(flow / 5.0, 1.0);
    delta.vitals = {
      spo2: flowFactor * fio2Ecmo * 16,
      sbp: flowFactor * 20,
      dbp: flowFactor * 10,
      // map omitted — recomputed in simulationEngine Step 6
    };
  }

  return delta;
}
