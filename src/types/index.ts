// ─── Patient Demographics ───────────────────────────────────────────────────

export interface PatientDemographics {
  name: string;
  uhid: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  bmi: number;    // auto-calculated
  bsa: number;    // auto-calculated (Mosteller)
  admissionDateTime: string;
  diagnosis: string;
  clinicalHistory: string;
}

// ─── Lab Parameters ──────────────────────────────────────────────────────────

export type LabFlag = 'critical-high' | 'high' | 'normal' | 'low' | 'critical-low';

export interface LabParameter {
  id: string;
  parameter: string;
  result: string;
  unit: string;
  refRangeLow: number | '';
  refRangeHigh: number | '';
  flag: LabFlag;
  isCritical: boolean;
}

export type LabPanelKey =
  | 'hematology'
  | 'biochemistry'
  | 'abg'
  | 'coagulation'
  | 'cardiacMarkers'
  | 'infection'
  | 'icuEcmo';

export interface LabPanel {
  hematology: LabParameter[];
  biochemistry: LabParameter[];
  abg: LabParameter[];
  coagulation: LabParameter[];
  cardiacMarkers: LabParameter[];
  infection: LabParameter[];
  icuEcmo: LabParameter[];
}

// ─── Vitals ──────────────────────────────────────────────────────────────────

export interface PressureValue {
  sys: number;
  dia: number;
  mean: number;
}

export interface Vitals {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  cvp: number;
  pap: PressureValue;
  spo2: number;
  rr: number;
  temperature: number;
  etco2: number;
  pip: number;
  peep: number;
}

// ─── Waveforms ───────────────────────────────────────────────────────────────

export type ECGRhythm =
  | 'sinus'
  | 'af'
  | 'vt'
  | 'vf'
  | 'svt'
  | 'bradycardia'
  | 'heart-block-2'
  | 'heart-block-3'
  | 'paced';

export type ArtLineDamping = 'normal' | 'over' | 'under';

export interface ECGWaveformConfig {
  rhythm: ECGRhythm;
  hrVariability: number;   // ms
  stChanges: number;       // mm elevation/depression
  qrsWidth: number;        // ms
}

export interface ArtLineWaveformConfig {
  dicroticNotch: boolean;
  pulsePressure: number;
  damping: ArtLineDamping;
  respiratoryVariation: number; // percentage
}

export interface CVPWaveformConfig {
  aWaveAmplitude: number;
  vWaveAmplitude: number;
  meanValue: number;
}

export interface SpO2PlethConfig {
  amplitude: number;
  perfusionIndex?: number;
}

export interface WaveformConfig {
  ecg: ECGWaveformConfig;
  arterialLine: ArtLineWaveformConfig;
  cvp: CVPWaveformConfig;
  pap: PressureValue;
  spo2Pleth: SpO2PlethConfig;
}

// ─── Device: ECMO ─────────────────────────────────────────────────────────────

export type ECMOMode = 'VV' | 'VA' | 'VAV';

export interface ECMOSettings {
  enabled: boolean;
  mode: ECMOMode;
  cannulaArterial: string;
  cannulaVenous: string;
  flow: number;        // L/min
  rpm: number;
  sweepGas: number;    // L/min
  fio2Ecmo: number;    // 0.21–1.0
  preMembraneO2: number;
  postMembraneO2: number;
  preMembraneO2Sat: number;
  postMembraneO2Sat: number;
  deltaPressure: number;
  heparinDose: number; // IU/hr
}

// ─── Device: Ventilator ──────────────────────────────────────────────────────

export type VentMode = 'VC-AC' | 'PC-AC' | 'SIMV-VC' | 'SIMV-PC' | 'APRV' | 'CPAP' | 'PSV';

export interface VentilatorSettings {
  enabled: boolean;
  mode: VentMode;
  tidalVolume: number;      // mL
  respiratoryRate: number;
  peep: number;             // cmH2O
  fio2: number;             // 0.21–1.0
  plateauPressure: number;  // cmH2O
  pip: number;              // cmH2O
  ieRatio: string;          // e.g. "1:2"
  pSupport: number;         // cmH2O (PSV)
  pHigh: number;            // APRV
  pLow: number;             // APRV
  tHigh: number;            // APRV seconds
  tLow: number;             // APRV seconds
}

// ─── Device: IABP ────────────────────────────────────────────────────────────

export type IABPTiming = '1:1' | '1:2' | '1:3';
export type IABPTrigger = 'ECG' | 'Pressure' | 'Pacemaker' | 'Internal';

export interface IABPSettings {
  enabled: boolean;
  timing: IABPTiming;
  triggerMode: IABPTrigger;
  augmentation: number;  // percentage 0–100
  inflation: number;     // ms
  deflation: number;     // ms
  balloonVolume: number; // mL (typically 30-50)
}

// ─── Device: Defibrillator ───────────────────────────────────────────────────

export type DefibrillatorMode = 'Monitor' | 'Sync' | 'Defib' | 'Pacer';

export interface DefibrillatorSettings {
  mode: DefibrillatorMode;
  energy: number;       // J
  pacing: boolean;
  pacingRate: number;   // bpm
  pacingOutput: number; // mA
}

export interface DevicesState {
  ecmo: ECMOSettings;
  ventilator: VentilatorSettings;
  iabp: IABPSettings;
  defibrillator: DefibrillatorSettings;
}

// ─── Drugs / Fluids / Blood ──────────────────────────────────────────────────

export type DrugCategory =
  | 'vasopressor'
  | 'inotrope'
  | 'sedative'
  | 'analgesic'
  | 'antibiotic'
  | 'anticoagulant'
  | 'antiarrhythmic'
  | 'diuretic'
  | 'other';

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  category: DrugCategory;
  dose: number;
  unit: string;
  route: 'IV' | 'IM' | 'PO' | 'SL' | 'SC' | 'Inhaled';
  frequency: string;
  weightBased: boolean;
  calculatedDose: number;
  infusionRate: number; // mL/hr if applicable
  concentration: string;
  notes: string;
}

export type FluidType =
  | 'Normal Saline'
  | 'Lactated Ringer'
  | 'D5W'
  | 'D5NS'
  | 'Albumin 5%'
  | 'Albumin 25%'
  | 'HES 6%'
  | 'Other';

export interface Fluid {
  id: string;
  type: FluidType;
  volume: number;  // mL
  rate: number;    // mL/hr
  duration: number; // hrs
}

export type BloodProductType = 'PRBC' | 'FFP' | 'Platelets' | 'Cryoprecipitate' | 'Whole Blood';

export interface BloodProduct {
  id: string;
  type: BloodProductType;
  units: number;
  volume: number;
  crossmatch: boolean;
  irradiated: boolean;
  leucodepleted: boolean;
}

export interface DrugState {
  drugs: Drug[];
  fluids: Fluid[];
  bloodProducts: BloodProduct[];
}

// ─── Media ───────────────────────────────────────────────────────────────────

export type MediaType = 'xray' | 'echo' | 'ultrasound' | 'ct' | 'mri' | 'other';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  type: MediaType;
  date: string;
  label: string;
  notes: string;
  attachedToTimeline: boolean;
  timelineTimestamp?: string;
}

// ─── Scenario ────────────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  createdAt: string;
  updatedAt: string;
  demographics: PatientDemographics;
  labs: LabPanel;
  vitals: Vitals;
  waveforms: WaveformConfig;
  devices: DevicesState;
  drugState: DrugState;
  media: MediaItem[];
}

// ─── Simulation Engine Types ─────────────────────────────────────────────────

export interface SimulationDelta {
  vitals: Partial<Vitals>;
  waveforms: Partial<WaveformConfig>;
  labs: Partial<LabPanel>;
}

export interface PhysiologyContext {
  vitals: Vitals;
  devices: DevicesState;
  drugState: DrugState;
  labs: LabPanel;
  demographics: PatientDemographics;
}

// ─── Waveform Point ──────────────────────────────────────────────────────────

export interface WaveformPoint {
  x: number;
  y: number;
}

export type WaveformSegment = WaveformPoint[];
