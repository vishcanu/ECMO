import type { PhysiologyContext, SimulationDelta } from '../../types';

/**
 * IABP Engine — counterpulsation hemodynamic effects
 * Inflates in diastole → increases diastolic pressure, coronary perfusion
 * Deflates in systole → reduces afterload, increases cardiac output
 */
export function calculateIABPEffects(ctx: PhysiologyContext): SimulationDelta {
  const { iabp } = ctx.devices;
  const delta: SimulationDelta = { vitals: {}, waveforms: {}, labs: {} };

  if (!iabp.enabled) return delta;

  const { augmentation, timing } = iabp;
  const augFactor = augmentation / 100;

  // Timing ratio affects efficacy
  const timingFactor = timing === '1:1' ? 1.0 : timing === '1:2' ? 0.5 : 0.33;

  // Diastolic augmentation: increases DBP by ~10–20 mmHg at full augmentation
  const dbpGain = augFactor * timingFactor * 15;

  // Systolic unloading: decreases afterload → slight SBP reduction
  const sbpReduction = augFactor * timingFactor * 8;

  // Net effect: MAP mildly increases, HR may decrease reflexively
  const mapGain = (dbpGain - sbpReduction) / 3;
  const hrReduction = augFactor * timingFactor * 3;

  delta.vitals = {
    sbp: -sbpReduction,
    dbp: dbpGain,
    map: mapGain,
    hr: -hrReduction,
  };

  return delta;
}
