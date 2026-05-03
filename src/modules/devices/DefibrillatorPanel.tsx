import React from 'react';
import styles from './DefibrillatorPanel.module.css';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { DefibrillatorMode } from '../../types';
import { Zap, AlertTriangle } from 'lucide-react';

const MODE_OPTIONS: { value: DefibrillatorMode; label: string }[] = [
  { value: 'Monitor', label: 'Monitor Only' },
  { value: 'Sync', label: 'Synchronized Cardioversion' },
  { value: 'Defib', label: 'Defibrillation' },
  { value: 'Pacer', label: 'External Pacing' },
];

const ENERGY_PRESETS = [50, 100, 120, 150, 200, 300, 360];

export const DefibrillatorPanel: React.FC = () => {
  const defib = useScenarioStore((s) => s.activeScenario.devices.defibrillator);
  const updateDefibrillator = useScenarioStore((s) => s.updateDefibrillator);

  const isPacer = defib.mode === 'Pacer';
  const isDefibMode = defib.mode === 'Defib' || defib.mode === 'Sync';

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <div className={styles.modeRow}>
          <Select
            label="Defibrillator Mode"
            value={defib.mode}
            onValueChange={(v) => updateDefibrillator({ mode: v as DefibrillatorMode })}
            options={MODE_OPTIONS}
          />
        </div>
        <Badge
          variant={defib.mode === 'Defib' ? 'danger' : defib.mode === 'Sync' ? 'warning' : defib.mode === 'Pacer' ? 'info' : 'muted'}
          size="md"
          dot
        >
          {defib.mode.toUpperCase()}
        </Badge>
      </div>

      <div className={styles.body}>
        {/* Energy Settings */}
        {isDefibMode && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Zap size={14} />
              <span>Energy Selection</span>
            </div>
            <div className={styles.energyGrid}>
              {ENERGY_PRESETS.map((j) => (
                <button
                  key={j}
                  className={`${styles.energyBtn} ${defib.energy === j ? styles.energySelected : ''}`}
                  onClick={() => updateDefibrillator({ energy: j })}
                >
                  {j} J
                </button>
              ))}
            </div>
            <div className={styles.grid2}>
              <Input
                label="Custom Energy"
                type="number"
                value={defib.energy}
                onChange={(e) => updateDefibrillator({ energy: parseFloat(e.target.value) || 0 })}
                unit="J"
                hint="AHA: Biphasic 120–200J for VF"
              />
            </div>
            {defib.mode === 'Defib' && (
              <div className={styles.warningBox}>
                <AlertTriangle size={14} />
                <span>Defibrillation mode active. Ensure all personnel stand clear.</span>
              </div>
            )}
            {defib.mode === 'Sync' && (
              <div className={styles.infoBox}>
                <AlertTriangle size={14} />
                <span>Synchronized mode: Shock delivered on R-wave. Use for hemodynamically unstable AF/AFL/SVT/VT.</span>
              </div>
            )}
          </section>
        )}

        {/* Pacemaker Settings */}
        {isPacer && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Zap size={14} />
              <span>External Pacing</span>
            </div>
            <div className={styles.grid2}>
              <Toggle
                label="Pacing On"
                checked={defib.pacing}
                onCheckedChange={(v) => updateDefibrillator({ pacing: v })}
              />
            </div>
            <div className={styles.grid2}>
              <Slider
                label="Pacing Rate"
                value={defib.pacingRate}
                min={30}
                max={200}
                unit="bpm"
                onValueChange={(v) => updateDefibrillator({ pacingRate: v })}
                disabled={!defib.pacing}
              />
              <Slider
                label="Pacing Output"
                value={defib.pacingOutput}
                min={0}
                max={200}
                unit="mA"
                onValueChange={(v) => updateDefibrillator({ pacingOutput: v })}
                disabled={!defib.pacing}
                hint="Threshold typically 40–80 mA"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
