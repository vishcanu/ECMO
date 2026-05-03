import type { PhysiologyContext, SimulationDelta, Vitals, WaveformConfig } from '../types';
import { calculateECMOEffects } from './devices/ecmoEngine';
import { calculateVentilatorEffects } from './devices/ventilatorEngine';
import { calculateIABPEffects } from './devices/iabpEngine';
import { calculateDrugEffects } from './drugs/drugEffects';
import { evaluateLabTriggers } from './physiology/physiologyCalculations';

// ─── Central Simulation Engine ────────────────────────────────────────────────

export function runSimulation(ctx: PhysiologyContext): SimulationDelta {
  let vitalsDelta: Partial<Vitals> = {};
  let waveformsDelta: Partial<WaveformConfig> = {};

  // Step 1: Device effects
  const ecmoDelta = calculateECMOEffects(ctx);
  const ventDelta  = calculateVentilatorEffects(ctx);
  const iabpDelta  = calculateIABPEffects(ctx);

  vitalsDelta = mergeVitalDeltas(vitalsDelta, ecmoDelta.vitals);
  vitalsDelta = mergeVitalDeltas(vitalsDelta, ventDelta.vitals);
  vitalsDelta = mergeVitalDeltas(vitalsDelta, iabpDelta.vitals);

  // Deep-merge waveform deltas so sub-keys are not wiped
  if (ecmoDelta.waveforms) waveformsDelta = deepMergeWaveforms(waveformsDelta, ecmoDelta.waveforms);
  if (ventDelta.waveforms)  waveformsDelta = deepMergeWaveforms(waveformsDelta, ventDelta.waveforms);
  if (iabpDelta.waveforms)  waveformsDelta = deepMergeWaveforms(waveformsDelta, iabpDelta.waveforms);

  // Step 2: Drug effects
  const drugDelta = calculateDrugEffects(ctx);
  vitalsDelta = mergeVitalDeltas(vitalsDelta, drugDelta.vitals);

  // Step 3: Lab-triggered physiology
  const labDelta = evaluateLabTriggers(ctx);
  vitalsDelta = mergeVitalDeltas(vitalsDelta, labDelta.vitals);

  // Step 4: Apply deltas additively on top of base vitals
  const applied: Vitals = { ...ctx.vitals };
  for (const _key of Object.keys(vitalsDelta) as (keyof Vitals)[]) {
    const key = _key;
    if (key === 'map') continue; // recomputed from SBP/DBP in Step 6
    if (key === 'pap') {
      const pd = (vitalsDelta as Partial<Vitals>).pap ?? { sys: 0, dia: 0, mean: 0 };
      applied.pap = {
        sys:  ctx.vitals.pap.sys  + (pd.sys  || 0),
        dia:  ctx.vitals.pap.dia  + (pd.dia  || 0),
        mean: ctx.vitals.pap.mean + (pd.mean || 0),
      };
    } else {
      (applied as unknown as Record<string, number>)[key] =
        ((ctx.vitals as unknown as Record<string, number>)[key] || 0) +
        ((vitalsDelta as unknown as Record<string, number>)[key] || 0);
    }
  }

  // Step 5: Clamp
  const finalVitals = clampVitals(applied);

  // Step 6: Always recompute MAP from final SBP/DBP (avoids double-count)
  finalVitals.map = Math.round(finalVitals.dbp + (finalVitals.sbp - finalVitals.dbp) / 3);
  // PAP mean also
  finalVitals.pap.mean = Math.round(finalVitals.pap.dia + (finalVitals.pap.sys - finalVitals.pap.dia) / 3);

  return {
    vitals: finalVitals,
    waveforms: waveformsDelta,
    labs: {},
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mergeVitalDeltas(base: Partial<Vitals>, incoming: Partial<Vitals>): Partial<Vitals> {
  const merged = { ...base };
  for (const _key of Object.keys(incoming) as (keyof Vitals)[]) {
    const key = _key;
    if (key === 'map') continue; // always recomputed — skip accumulating map deltas
    if (key === 'pap') {
      const basePap = (base as Vitals).pap ?? { sys: 0, dia: 0, mean: 0 };
      const inPap   = (incoming as Vitals).pap ?? { sys: 0, dia: 0, mean: 0 };
      (merged as Vitals).pap = {
        sys:  (basePap.sys  || 0) + (inPap.sys  || 0),
        dia:  (basePap.dia  || 0) + (inPap.dia  || 0),
        mean: (basePap.mean || 0) + (inPap.mean || 0),
      };
    } else {
      (merged as Record<string, number>)[key] =
        ((base    as Record<string, number>)[key] || 0) +
        ((incoming as Record<string, number>)[key] || 0);
    }
  }
  return merged;
}

/**
 * Deep-merges waveform deltas one level deep so partial sub-objects
 * (e.g. { arterialLine: { damping: 'over' } }) do not wipe existing
 * authored sub-keys (e.g. dicroticNotch, respiratoryVariation).
 */
function deepMergeWaveforms(
  base: Partial<WaveformConfig>,
  incoming: Partial<WaveformConfig>,
): Partial<WaveformConfig> {
  const result = { ...base };
  for (const key of Object.keys(incoming) as (keyof WaveformConfig)[]) {
    const bv = base[key];
    const iv = incoming[key];
    if (iv !== null && typeof iv === 'object' && !Array.isArray(iv)
        && bv !== null && typeof bv === 'object' && !Array.isArray(bv)) {
      // Both are objects — merge at one level deep
      (result as Record<string, unknown>)[key] = { ...bv, ...iv };
    } else {
      (result as Record<string, unknown>)[key] = iv;
    }
  }
  return result;
}

function clampVitals(vitals: Vitals): Vitals {
  return {
    ...vitals,
    hr:          clamp(vitals.hr, 20, 250),
    sbp:         clamp(vitals.sbp, 40, 280),
    dbp:         clamp(vitals.dbp, 20, 180),
    map:         clamp(vitals.map, 30, 200),
    cvp:         clamp(vitals.cvp, -5, 30),
    spo2:        clamp(vitals.spo2, 50, 100),
    rr:          clamp(vitals.rr, 4, 60),
    temperature: clamp(vitals.temperature, 30, 42),
    etco2:       clamp(vitals.etco2, 10, 80),
    pip:         clamp(vitals.pip, 5, 60),
    peep:        clamp(vitals.peep, 0, 25),
    pap: {
      sys:  clamp(vitals.pap.sys, 10, 120),
      dia:  clamp(vitals.pap.dia, 5, 80),
      mean: clamp(vitals.pap.mean, 8, 90),
    },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
