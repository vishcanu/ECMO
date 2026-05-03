import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Scenario,
  PatientDemographics,
  LabPanelKey,
  LabParameter,
  Vitals,
  WaveformConfig,
  ECMOSettings,
  VentilatorSettings,
  IABPSettings,
  DefibrillatorSettings,
  DevicesState,
  Drug,
  Fluid,
  BloodProduct,
  MediaItem,
} from '../types';
import { runSimulation } from '../engine/simulationEngine';
import {
  defaultDemographics,
  defaultLabPanel,
  defaultVitals,
  defaultWaveformConfig,
  defaultDevicesState,
  defaultDrugState,
} from './defaults';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deep-merges waveform objects one level so partial sub-keys don't wipe authored values. */
function deepMergeWaveforms(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(incoming)) {
    const bv = base[key];
    const iv = incoming[key];
    if (iv && typeof iv === 'object' && !Array.isArray(iv)
        && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      result[key] = { ...(bv as object), ...(iv as object) };
    } else {
      result[key] = iv;
    }
  }
  return result;
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ScenarioStoreState {
  // Active scenario
  activeScenario: Scenario;

  // Saved scenarios list
  savedScenarios: Scenario[];

  // UI state
  currentStep: number;
  previewOpen: boolean;

  // Simulation preview — computed output, separate from user-authored scenario vitals
  simulationPreview: { vitals: Vitals; waveforms: WaveformConfig } | null;
  isDirty: boolean;

  // Actions: Demographics
  updateDemographics: (data: Partial<PatientDemographics>) => void;

  // Actions: Labs
  updateLabParameter: (panel: LabPanelKey, param: LabParameter) => void;
  addLabParameter: (panel: LabPanelKey, param: LabParameter) => void;
  removeLabParameter: (panel: LabPanelKey, id: string) => void;

  // Actions: Vitals
  updateVitals: (vitals: Partial<Vitals>) => void;

  // Actions: Waveforms
  updateWaveforms: (config: Partial<WaveformConfig>) => void;

  // Actions: Devices
  updateECMO: (settings: Partial<ECMOSettings>) => void;
  updateVentilator: (settings: Partial<VentilatorSettings>) => void;
  updateIABP: (settings: Partial<IABPSettings>) => void;
  updateDefibrillator: (settings: Partial<DefibrillatorSettings>) => void;
  /** Called by cross-tab BroadcastChannel sync — does NOT re-broadcast */
  setDevicesFromSync: (devices: DevicesState) => void;

  // Actions: Drugs / Fluids / Blood
  addDrug: (drug: Drug) => void;
  updateDrug: (id: string, drug: Partial<Drug>) => void;
  removeDrug: (id: string) => void;
  addFluid: (fluid: Fluid) => void;
  updateFluid: (id: string, fluid: Partial<Fluid>) => void;
  removeFluid: (id: string) => void;
  addBloodProduct: (product: BloodProduct) => void;
  updateBloodProduct: (id: string, product: Partial<BloodProduct>) => void;
  removeBloodProduct: (id: string) => void;

  // Actions: Media
  addMedia: (item: MediaItem) => void;
  updateMedia: (id: string, item: Partial<MediaItem>) => void;
  removeMedia: (id: string) => void;

  // Actions: Scenario Management
  runSimulationEngine: () => void;
  clearSimulationPreview: () => void;
  saveScenario: () => void;
  loadScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  newScenario: () => void;

  // Actions: UI
  setStep: (step: number) => void;
  setPreviewOpen: (open: boolean) => void;
  updateScenarioMeta: (meta: { name?: string; description?: string; difficulty?: Scenario['difficulty']; category?: string }) => void;
}

// ─── Defaults Factory ─────────────────────────────────────────────────────────

function createNewScenario(): Scenario {
  return {
    id: crypto.randomUUID(),
    name: 'New Scenario',
    description: '',
    difficulty: 'intermediate',
    category: 'ECMO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    demographics: { ...defaultDemographics },
    labs: defaultLabPanel(),
    vitals: { ...defaultVitals },
    waveforms: defaultWaveformConfig(),
    devices: defaultDevicesState(),
    drugState: defaultDrugState(),
    media: [],
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useScenarioStore = create<ScenarioStoreState>()(
  persist(
    (set, _get) => ({
      activeScenario: createNewScenario(),
      savedScenarios: [],
      currentStep: 0,
      previewOpen: false,
      isDirty: false,
      simulationPreview: null,

      // ── Demographics ──
      updateDemographics: (data) =>
        set((state) => {
          const updated = { ...state.activeScenario.demographics, ...data };
          // Auto BMI + BSA
          if (updated.height > 0 && updated.weight > 0) {
            updated.bmi = parseFloat((updated.weight / Math.pow(updated.height / 100, 2)).toFixed(1));
            // Mosteller: BSA = sqrt((H * W) / 3600)
            updated.bsa = parseFloat(Math.sqrt((updated.height * updated.weight) / 3600).toFixed(2));
          }
          return {
            activeScenario: { ...state.activeScenario, demographics: updated, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        }),

      // ── Labs ──
      updateLabParameter: (panel, param) =>
        set((state) => {
          const updatedPanel = state.activeScenario.labs[panel].map((p) =>
            p.id === param.id ? { ...param, flag: computeFlag(param) } : p
          );
          return {
            activeScenario: {
              ...state.activeScenario,
              labs: { ...state.activeScenario.labs, [panel]: updatedPanel },
              updatedAt: new Date().toISOString(),
            },
            isDirty: true,
          };
        }),

      addLabParameter: (panel, param) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            labs: {
              ...state.activeScenario.labs,
              [panel]: [...state.activeScenario.labs[panel], { ...param, flag: computeFlag(param) }],
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      removeLabParameter: (panel, id) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            labs: {
              ...state.activeScenario.labs,
              [panel]: state.activeScenario.labs[panel].filter((p) => p.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      // ── Vitals ──
      updateVitals: (vitals) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            vitals: { ...state.activeScenario.vitals, ...vitals },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      // ── Waveforms ──
      updateWaveforms: (config) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            waveforms: { ...state.activeScenario.waveforms, ...config },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      // ── Devices ──
      updateECMO: (settings) =>
        set((state) => {
          const newDevices = {
            ...state.activeScenario.devices,
            ecmo: { ...state.activeScenario.devices.ecmo, ...settings },
          };
          return {
            activeScenario: { ...state.activeScenario, devices: newDevices, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        }),

      updateVentilator: (settings) =>
        set((state) => {
          const newDevices = {
            ...state.activeScenario.devices,
            ventilator: { ...state.activeScenario.devices.ventilator, ...settings },
          };
          return {
            activeScenario: { ...state.activeScenario, devices: newDevices, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        }),

      updateIABP: (settings) =>
        set((state) => {
          const newDevices = {
            ...state.activeScenario.devices,
            iabp: { ...state.activeScenario.devices.iabp, ...settings },
          };
          return {
            activeScenario: { ...state.activeScenario, devices: newDevices, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        }),

      updateDefibrillator: (settings) =>
        set((state) => {
          const newDevices = {
            ...state.activeScenario.devices,
            defibrillator: { ...state.activeScenario.devices.defibrillator, ...settings },
          };
          return {
            activeScenario: { ...state.activeScenario, devices: newDevices, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        }),

      setDevicesFromSync: (devices) =>
        set((state) => ({
          activeScenario: { ...state.activeScenario, devices, updatedAt: new Date().toISOString() },
          isDirty: true,
        })),

      // ── Drugs ──
      addDrug: (drug) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: { ...state.activeScenario.drugState, drugs: [...state.activeScenario.drugState.drugs, drug] },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      updateDrug: (id, drug) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              drugs: state.activeScenario.drugState.drugs.map((d) => (d.id === id ? { ...d, ...drug } : d)),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      removeDrug: (id) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              drugs: state.activeScenario.drugState.drugs.filter((d) => d.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      addFluid: (fluid) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: { ...state.activeScenario.drugState, fluids: [...state.activeScenario.drugState.fluids, fluid] },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      updateFluid: (id, fluid) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              fluids: state.activeScenario.drugState.fluids.map((f) => (f.id === id ? { ...f, ...fluid } : f)),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      removeFluid: (id) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              fluids: state.activeScenario.drugState.fluids.filter((f) => f.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      addBloodProduct: (product) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              bloodProducts: [...state.activeScenario.drugState.bloodProducts, product],
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      updateBloodProduct: (id, product) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              bloodProducts: state.activeScenario.drugState.bloodProducts.map((p) =>
                p.id === id ? { ...p, ...product } : p
              ),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      removeBloodProduct: (id) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            drugState: {
              ...state.activeScenario.drugState,
              bloodProducts: state.activeScenario.drugState.bloodProducts.filter((p) => p.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      // ── Media ──
      addMedia: (item) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            media: [...state.activeScenario.media, item],
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      updateMedia: (id, item) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            media: state.activeScenario.media.map((m) => (m.id === id ? { ...m, ...item } : m)),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      removeMedia: (id) =>
        set((state) => ({
          activeScenario: {
            ...state.activeScenario,
            media: state.activeScenario.media.filter((m) => m.id !== id),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })),

      // ── Simulation Engine ──
      // Computes adjusted vitals/waveforms and stores in simulationPreview.
      // NEVER overwrites activeScenario.vitals so user edits are preserved.
      runSimulationEngine: () =>
        set((state) => {
          const delta = runSimulation({
            vitals: state.activeScenario.vitals,
            devices: state.activeScenario.devices,
            drugState: state.activeScenario.drugState,
            labs: state.activeScenario.labs,
            demographics: state.activeScenario.demographics,
          });
          return {
            simulationPreview: {
              vitals: delta.vitals as Vitals,
              waveforms: deepMergeWaveforms(
                state.activeScenario.waveforms as unknown as Record<string, unknown>,
                delta.waveforms as unknown as Record<string, unknown>,
              ) as unknown as WaveformConfig,
            },
          };
        }),

      clearSimulationPreview: () => set({ simulationPreview: null }),

      // ── Scenario Management ──
      saveScenario: () =>
        set((state) => {
          const scenario = { ...state.activeScenario, updatedAt: new Date().toISOString() };
          const existing = state.savedScenarios.findIndex((s) => s.id === scenario.id);
          const updatedList =
            existing >= 0
              ? state.savedScenarios.map((s) => (s.id === scenario.id ? scenario : s))
              : [...state.savedScenarios, scenario];
          return { savedScenarios: updatedList, isDirty: false, activeScenario: scenario };
        }),

      loadScenario: (id) =>
        set((state) => {
          const scenario = state.savedScenarios.find((s) => s.id === id);
          if (!scenario) return state;
          return { activeScenario: { ...scenario }, isDirty: false, currentStep: 0, simulationPreview: null };
        }),

      duplicateScenario: (id) =>
        set((state) => {
          const scenario = state.savedScenarios.find((s) => s.id === id);
          if (!scenario) return state;
          // Strip any existing [Preset N] suffix to get the canonical base name
          const baseName = scenario.name.replace(/\s*\[Preset \d+\]$/, '');
          // Count all scenarios that share this base name (original + existing presets)
          const existingCount = state.savedScenarios.filter((s) =>
            s.name.replace(/\s*\[Preset \d+\]$/, '') === baseName,
          ).length;
          // Original is implicitly Preset 1; first copy = Preset 2, etc.
          const nextPreset = existingCount + 1;
          const duplicate = {
            ...scenario,
            id: crypto.randomUUID(),
            name: `${baseName} [Preset ${nextPreset}]`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { savedScenarios: [...state.savedScenarios, duplicate] };
        }),

      deleteScenario: (id) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
        })),

      newScenario: () =>
        set(() => ({
          activeScenario: createNewScenario(),
          isDirty: false,
          currentStep: 0,
          simulationPreview: null,
        })),

      // ── UI ──
      setStep: (step) => set({ currentStep: step }),
      setPreviewOpen: (open) => set({ previewOpen: open }),
      updateScenarioMeta: (meta) =>
        set((state) => ({
          activeScenario: { ...state.activeScenario, ...meta, updatedAt: new Date().toISOString() },
          isDirty: true,
        })),
    }),
    {
      name: 'ecmo-scenario-store',
      partialize: (state) => ({
        savedScenarios: state.savedScenarios,
        // Persist devices so the device-editor tab can bootstrap from them
        activeDevices: state.activeScenario.devices,
      }),
    }
  )
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeFlag(param: LabParameter): LabParameter['flag'] {
  const val = parseFloat(param.result as string);
  if (isNaN(val)) return 'normal';
  const low = typeof param.refRangeLow === 'number' ? param.refRangeLow : null;
  const high = typeof param.refRangeHigh === 'number' ? param.refRangeHigh : null;
  if (high !== null && val > high * 1.5) return 'critical-high';
  if (high !== null && val > high) return 'high';
  if (low !== null && val < low * 0.5) return 'critical-low';
  if (low !== null && val < low) return 'low';
  return 'normal';
}
