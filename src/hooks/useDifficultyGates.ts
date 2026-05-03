import { useScenarioStore } from '../store/scenarioStore';

/**
 * Derives UI permission gates from the active scenario's difficulty level.
 *
 * Basic        – sinus-only rhythms, no drugs, no CVP/PAP channels or editing
 * Intermediate – adds drugs + CVP numeric + CVP channel; PAP still hidden
 * Advanced     – all channels + all rhythms; waveform fine-tuning locked
 * Expert       – fully unrestricted
 */
export interface DifficultyGates {
  /** Show PAP numeric sliders and PAP waveform channel */
  showPAP: boolean;
  /** Show CVP numeric slider and CVP waveform channel */
  showCVP: boolean;
  /** Allow access to the Medications step (drugs, fluids, blood products) */
  showDrugs: boolean;
  /** Allow all ECG rhythms (AF, VT, VF, heart-block, paced) */
  fullRhythms: boolean;
  /** Allow manual waveform fine-tuning (ECG config, ART, CVP waveform sections) */
  waveformEditing: boolean;
}

const GATES: Record<string, DifficultyGates> = {
  basic: {
    showPAP: false,
    showCVP: false,
    showDrugs: false,
    fullRhythms: false,
    waveformEditing: false,
  },
  intermediate: {
    showPAP: false,
    showCVP: true,
    showDrugs: true,
    fullRhythms: true,
    waveformEditing: false,
  },
  advanced: {
    showPAP: true,
    showCVP: true,
    showDrugs: true,
    fullRhythms: true,
    waveformEditing: false,
  },
  expert: {
    showPAP: true,
    showCVP: true,
    showDrugs: true,
    fullRhythms: true,
    waveformEditing: true,
  },
};

export function useDifficultyGates(): DifficultyGates & { difficulty: string } {
  const difficulty = useScenarioStore((s) => s.activeScenario.difficulty);
  return { ...(GATES[difficulty] ?? GATES.expert), difficulty };
}
