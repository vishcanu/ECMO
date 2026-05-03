import type { PhysiologyContext, SimulationDelta, Drug } from '../../types';

interface DrugEffect {
  hrDelta: number;
  sbpDelta: number;
  dbpDelta: number;
  rrDelta: number;
  spo2Delta: number;
  temperatureDelta: number;
}

/**
 * Drug effects engine based on pharmacodynamic principles.
 * Effects are dose-dependent and additive across drug classes.
 */
export function calculateDrugEffects(ctx: PhysiologyContext): SimulationDelta {
  const { drugs } = ctx.drugState;
  const weight = ctx.demographics.weight || 70;

  let totalEffect: DrugEffect = {
    hrDelta: 0,
    sbpDelta: 0,
    dbpDelta: 0,
    rrDelta: 0,
    spo2Delta: 0,
    temperatureDelta: 0,
  };

  for (const drug of drugs) {
    const effect = computeSingleDrugEffect(drug, weight);
    totalEffect.hrDelta += effect.hrDelta;
    totalEffect.sbpDelta += effect.sbpDelta;
    totalEffect.dbpDelta += effect.dbpDelta;
    totalEffect.rrDelta += effect.rrDelta;
    totalEffect.spo2Delta += effect.spo2Delta;
    totalEffect.temperatureDelta += effect.temperatureDelta;
  }

  return {
    vitals: {
      hr:          totalEffect.hrDelta,
      sbp:         totalEffect.sbpDelta,
      dbp:         totalEffect.dbpDelta,
      rr:          totalEffect.rrDelta,
      spo2:        totalEffect.spo2Delta,
      temperature: totalEffect.temperatureDelta,
      // map is intentionally omitted — recomputed from sbp/dbp in simulationEngine Step 6
    },
    waveforms: {},
    labs: {},
  };
}

function computeSingleDrugEffect(drug: Drug, weight: number): DrugEffect {
  const effect: DrugEffect = {
    hrDelta: 0,
    sbpDelta: 0,
    dbpDelta: 0,
    rrDelta: 0,
    spo2Delta: 0,
    temperatureDelta: 0,
  };

  const dose = drug.weightBased ? drug.dose * weight : drug.dose;
  // Normalize dose to a 0–1 effect scale
  const normalizedDose = Math.min(dose / getReferenceDose(drug.name, weight), 2.0);

  switch (drug.category) {
    case 'vasopressor':
      // Norepinephrine, Vasopressin, Phenylephrine
      effect.sbpDelta = normalizedDose * 20;
      effect.dbpDelta = normalizedDose * 15;
      effect.hrDelta = -normalizedDose * 5; // reflex bradycardia
      break;

    case 'inotrope':
      // Dopamine, Dobutamine, Milrinone, Epinephrine
      effect.hrDelta = normalizedDose * 15;
      effect.sbpDelta = normalizedDose * 10;
      effect.dbpDelta = -normalizedDose * 5; // vasodilation at high dose
      break;

    case 'sedative':
      // Propofol, Midazolam, Dexmedetomidine
      effect.hrDelta = -normalizedDose * 8;
      effect.sbpDelta = -normalizedDose * 12;
      effect.dbpDelta = -normalizedDose * 8;
      effect.rrDelta = -normalizedDose * 4;
      effect.spo2Delta = -normalizedDose * 2;
      break;

    case 'analgesic':
      // Fentanyl, Morphine
      effect.rrDelta = -normalizedDose * 3;
      effect.hrDelta = -normalizedDose * 4;
      effect.sbpDelta = -normalizedDose * 5;
      break;

    case 'antiarrhythmic':
      // Amiodarone, Lidocaine
      effect.hrDelta = -normalizedDose * 10;
      effect.sbpDelta = -normalizedDose * 8;
      break;

    case 'diuretic':
      // Furosemide
      effect.sbpDelta = -normalizedDose * 6;
      effect.dbpDelta = -normalizedDose * 3;
      break;

    default:
      break;
  }

  return effect;
}

function getReferenceDose(drugName: string, weight: number): number {
  const refs: Record<string, number> = {
    Norepinephrine: 0.1 * weight,       // mcg/kg/min at moderate dose
    Vasopressin: 0.04,                   // units/min
    Epinephrine: 0.1 * weight,
    Dopamine: 10 * weight,
    Dobutamine: 10 * weight,
    Milrinone: 0.5 * weight,
    Propofol: 2 * weight,                // mg/hr
    Midazolam: 2,                        // mg/hr
    Dexmedetomidine: 1 * weight,         // mcg/kg/hr
    Fentanyl: 100,                       // mcg/hr
    Morphine: 5,                         // mg/hr
    Amiodarone: 150,                     // mg loading
    Furosemide: 40,                      // mg
  };
  return refs[drugName] ?? 10;
}
