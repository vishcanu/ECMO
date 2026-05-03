import type {
  PatientDemographics,
  LabPanel,
  LabParameter,
  Vitals,
  WaveformConfig,
  DevicesState,
  DrugState,
} from '../types';

// ─── Default Demographics ────────────────────────────────────────────────────

export const defaultDemographics: PatientDemographics = {
  name: '',
  uhid: '',
  age: 0,
  sex: 'male',
  height: 170,
  weight: 70,
  bmi: 24.2,
  bsa: 1.84,
  admissionDateTime: new Date().toISOString().slice(0, 16),
  diagnosis: '',
  clinicalHistory: '',
};

// ─── Default Lab Rows ─────────────────────────────────────────────────────────

function makeParam(
  id: string,
  parameter: string,
  result: string,
  unit: string,
  low: number | '',
  high: number | ''
): LabParameter {
  return { id, parameter, result, unit, refRangeLow: low, refRangeHigh: high, flag: 'normal', isCritical: false };
}

export function defaultLabPanel(): LabPanel {
  return {
    hematology: [
      makeParam('hb', 'Hemoglobin', '13.5', 'g/dL', 12, 17),
      makeParam('hct', 'Hematocrit', '40', '%', 36, 52),
      makeParam('wbc', 'WBC', '8.5', '×10³/μL', 4, 11),
      makeParam('plt', 'Platelets', '220', '×10³/μL', 150, 400),
      makeParam('rbc', 'RBC', '4.8', '×10⁶/μL', 4.2, 5.9),
    ],
    biochemistry: [
      makeParam('na', 'Sodium', '138', 'mmol/L', 135, 145),
      makeParam('k', 'Potassium', '4.0', 'mmol/L', 3.5, 5.1),
      makeParam('cl', 'Chloride', '102', 'mmol/L', 96, 106),
      makeParam('bun', 'BUN', '18', 'mg/dL', 7, 25),
      makeParam('cr', 'Creatinine', '0.9', 'mg/dL', 0.6, 1.2),
      makeParam('glc', 'Glucose', '110', 'mg/dL', 70, 100),
      makeParam('alb', 'Albumin', '3.8', 'g/dL', 3.4, 5.4),
      makeParam('tbil', 'Total Bilirubin', '0.8', 'mg/dL', 0, 1.2),
      makeParam('ast', 'AST', '28', 'U/L', 0, 40),
      makeParam('alt', 'ALT', '22', 'U/L', 0, 56),
    ],
    abg: [
      makeParam('ph', 'pH', '7.40', '', 7.35, 7.45),
      makeParam('pco2', 'PaCO2', '40', 'mmHg', 35, 45),
      makeParam('po2', 'PaO2', '95', 'mmHg', 80, 100),
      makeParam('hco3', 'HCO3', '24', 'mmol/L', 22, 26),
      makeParam('be', 'Base Excess', '0', 'mmol/L', -2, 2),
      makeParam('sao2', 'SaO2', '98', '%', 95, 100),
      makeParam('lac', 'Lactate', '1.2', 'mmol/L', 0.5, 2.0),
    ],
    coagulation: [
      makeParam('pt', 'PT', '12.5', 'sec', 11, 14),
      makeParam('inr', 'INR', '1.0', '', 0.8, 1.1),
      makeParam('aptt', 'aPTT', '30', 'sec', 25, 38),
      makeParam('fibr', 'Fibrinogen', '320', 'mg/dL', 200, 400),
      makeParam('ddimer', 'D-Dimer', '0.3', 'μg/mL FEU', 0, 0.5),
    ],
    cardiacMarkers: [
      makeParam('tni', 'Troponin I', '0.02', 'ng/mL', 0, 0.04),
      makeParam('bnp', 'BNP', '80', 'pg/mL', 0, 100),
      makeParam('ck', 'CK-MB', '3.5', 'ng/mL', 0, 5),
      makeParam('ldh', 'LDH', '200', 'U/L', 122, 222),
    ],
    infection: [
      makeParam('crp', 'CRP', '5', 'mg/L', 0, 10),
      makeParam('pct', 'Procalcitonin', '0.1', 'ng/mL', 0, 0.5),
      makeParam('esr', 'ESR', '15', 'mm/hr', 0, 20),
    ],
    icuEcmo: [
      makeParam('act', 'ACT', '180', 'sec', 160, 220),
      makeParam('anti10', 'Anti-Xa', '0.35', 'IU/mL', 0.3, 0.7),
      makeParam('hbv', 'Plasma Free Hb', '20', 'mg/dL', 0, 50),
      makeParam('ldi', 'LDH (Hemolysis)', '250', 'U/L', 122, 222),
      makeParam('fibr2', 'Fibrinogen (circuit)', '300', 'mg/dL', 200, 400),
    ],
  };
}

// ─── Default Vitals ───────────────────────────────────────────────────────────

export const defaultVitals: Vitals = {
  hr: 80,
  sbp: 120,
  dbp: 70,
  map: 87,
  cvp: 10,
  pap: { sys: 25, dia: 10, mean: 15 },
  spo2: 98,
  rr: 16,
  temperature: 37.0,
  etco2: 38,
  pip: 20,
  peep: 5,
};

// ─── Default Waveforms ────────────────────────────────────────────────────────

export function defaultWaveformConfig(): WaveformConfig {
  return {
    ecg: {
      rhythm: 'sinus',
      hrVariability: 20,
      stChanges: 0,
      qrsWidth: 80,
    },
    arterialLine: {
      dicroticNotch: true,
      pulsePressure: 50,
      damping: 'normal',
      respiratoryVariation: 5,
    },
    cvp: {
      aWaveAmplitude: 4,
      vWaveAmplitude: 3,
      meanValue: 10,
    },
    pap: { sys: 25, dia: 10, mean: 15 },
    spo2Pleth: {
      amplitude: 80,
      perfusionIndex: 5.0,
    },
  };
}

// ─── Default Devices ──────────────────────────────────────────────────────────

export function defaultDevicesState(): DevicesState {
  return {
    ecmo: {
      enabled: false,
      mode: 'VV',
      cannulaArterial: '15Fr',
      cannulaVenous: '21Fr',
      flow: 3.5,
      rpm: 3000,
      sweepGas: 4.0,
      fio2Ecmo: 1.0,
      preMembraneO2: 55,
      postMembraneO2: 500,
      preMembraneO2Sat: 75,
      postMembraneO2Sat: 100,
      deltaPressure: 20,
      heparinDose: 800,
    },
    ventilator: {
      enabled: true,
      mode: 'VC-AC',
      tidalVolume: 500,
      respiratoryRate: 14,
      peep: 5,
      fio2: 0.4,
      plateauPressure: 18,
      pip: 22,
      ieRatio: '1:2',
      pSupport: 10,
      pHigh: 25,
      pLow: 0,
      tHigh: 4.5,
      tLow: 0.6,
    },
    iabp: {
      enabled: false,
      timing: '1:1',
      triggerMode: 'ECG',
      augmentation: 80,
      inflation: 200,
      deflation: 300,
      balloonVolume: 40,
    },
    defibrillator: {
      mode: 'Monitor',
      energy: 200,
      pacing: false,
      pacingRate: 60,
      pacingOutput: 40,
    },
  };
}

// ─── Default Drug State ───────────────────────────────────────────────────────

export function defaultDrugState(): DrugState {
  return {
    drugs: [],
    fluids: [],
    bloodProducts: [],
  };
}
