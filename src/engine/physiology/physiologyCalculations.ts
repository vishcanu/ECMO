import type { PhysiologyContext, SimulationDelta } from '../../types';

/**
 * Lab-Trigger Physiology Engine
 * Evaluates lab values and applies compensatory physiological changes.
 * Mimics clinical reality: deranged labs → altered vitals
 */
export function evaluateLabTriggers(ctx: PhysiologyContext): SimulationDelta {
  const delta: SimulationDelta = { vitals: {}, waveforms: {}, labs: {} };
  const vDelta = delta.vitals as Record<string, number>;

  const { hematology, abg, biochemistry } = ctx.labs;

  // ─── Hemoglobin ───────────────────────────────────────────────────────────
  const hbParam = hematology.find((p) => p.id === 'hb');
  if (hbParam) {
    const hb = parseFloat(hbParam.result as string);
    if (!isNaN(hb)) {
      if (hb < 7) {
        // Compensatory tachycardia and hypotension
        vDelta['hr'] = (vDelta['hr'] || 0) + (7 - hb) * 5;
        vDelta['sbp'] = (vDelta['sbp'] || 0) - (7 - hb) * 3;
        vDelta['map'] = (vDelta['map'] || 0) - (7 - hb) * 2;
      }
      if (hb < 5) {
        vDelta['spo2'] = (vDelta['spo2'] || 0) - 5;
      }
    }
  }

  // ─── ABG: PaO2 → SpO2 ────────────────────────────────────────────────────
  const pao2Param = abg.find((p) => p.id === 'po2');
  if (pao2Param) {
    const pao2 = parseFloat(pao2Param.result as string);
    if (!isNaN(pao2)) {
      // Simplified O2-Hb dissociation: PaO2 < 60 → SpO2 drops steeply
      if (pao2 < 60) {
        const spo2Drop = Math.min(((60 - pao2) / 60) * 20, 20);
        vDelta['spo2'] = (vDelta['spo2'] || 0) - spo2Drop;
      }
      if (pao2 < 40) {
        vDelta['hr'] = (vDelta['hr'] || 0) + 10;
      }
    }
  }

  // ─── ABG: pH → HR/RR ─────────────────────────────────────────────────────
  const phParam = abg.find((p) => p.id === 'ph');
  if (phParam) {
    const ph = parseFloat(phParam.result as string);
    if (!isNaN(ph)) {
      if (ph < 7.2) {
        // Acidosis → compensatory hyperventilation + tachycardia
        vDelta['rr'] = (vDelta['rr'] || 0) + (7.4 - ph) * 15;
        vDelta['hr'] = (vDelta['hr'] || 0) + (7.4 - ph) * 20;
        vDelta['sbp'] = (vDelta['sbp'] || 0) - (7.4 - ph) * 10;
      }
      if (ph > 7.6) {
        // Alkalosis → mild bradycardia
        vDelta['hr'] = (vDelta['hr'] || 0) - (ph - 7.4) * 10;
      }
    }
  }

  // ─── ABG: Lactate → Hemodynamics ─────────────────────────────────────────
  const lacParam = abg.find((p) => p.id === 'lac');
  if (lacParam) {
    const lac = parseFloat(lacParam.result as string);
    if (!isNaN(lac) && lac > 4) {
      // High lactate = poor perfusion → compensatory response
      vDelta['hr'] = (vDelta['hr'] || 0) + (lac - 2) * 3;
      vDelta['rr'] = (vDelta['rr'] || 0) + (lac - 2) * 1;
    }
  }

  // ─── Potassium → Rhythm effects (via HR) ─────────────────────────────────
  const kParam = biochemistry.find((p) => p.id === 'k');
  if (kParam) {
    const k = parseFloat(kParam.result as string);
    if (!isNaN(k)) {
      if (k > 6.5) {
        // Hyperkalemia → bradycardia
        vDelta['hr'] = (vDelta['hr'] || 0) - (k - 5) * 5;
      }
      if (k < 3.0) {
        // Hypokalemia → tachycardia
        vDelta['hr'] = (vDelta['hr'] || 0) + (3.5 - k) * 8;
      }
    }
  }

  // ─── Sodium → Blood pressure ──────────────────────────────────────────────
  const naParam = biochemistry.find((p) => p.id === 'na');
  if (naParam) {
    const na = parseFloat(naParam.result as string);
    if (!isNaN(na)) {
      if (na < 125) {
        vDelta['sbp'] = (vDelta['sbp'] || 0) - (135 - na) * 0.5;
        vDelta['map'] = (vDelta['map'] || 0) - (135 - na) * 0.3;
      }
    }
  }

  return delta;
}

// ─── BSA / BMI utilities ─────────────────────────────────────────────────────

export function calculateBMI(weight: number, height: number): number {
  if (height <= 0 || weight <= 0) return 0;
  return parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
}

export function calculateBSA(weight: number, height: number): number {
  if (height <= 0 || weight <= 0) return 0;
  // Mosteller formula
  return parseFloat(Math.sqrt((height * weight) / 3600).toFixed(2));
}

export function calculateIBW(height: number, sex: string): number {
  // Devine formula
  const base = sex === 'male' ? 50 : 45.5;
  const inches = (height / 2.54) - 60;
  return Math.max(base + 2.3 * inches, base);
}

export function calculateTidalVolumeTarget(height: number, sex: string): number {
  // ARDSNet: 6 mL/kg IBW
  const ibw = calculateIBW(height, sex);
  return Math.round(ibw * 6);
}
