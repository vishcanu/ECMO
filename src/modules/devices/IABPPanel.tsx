import React from 'react';
import styles from './IABPPanel.module.css';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { IABPTiming, IABPTrigger } from '../../types';

const TIMING_OPTIONS: { value: IABPTiming; label: string }[] = [
  { value: '1:1', label: '1:1 (Every Beat)' },
  { value: '1:2', label: '1:2 (Every Other Beat)' },
  { value: '1:3', label: '1:3 (Every Third Beat)' },
];

const TRIGGER_OPTIONS: { value: IABPTrigger; label: string }[] = [
  { value: 'ECG', label: 'ECG R-Wave' },
  { value: 'Pressure', label: 'Arterial Pressure' },
  { value: 'Pacemaker', label: 'Pacemaker Spike' },
  { value: 'Internal', label: 'Internal (Fixed Rate)' },
];

export const IABPPanel: React.FC = () => {
  const iabp = useScenarioStore((s) => s.activeScenario.devices.iabp);
  const updateIABP = useScenarioStore((s) => s.updateIABP);

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <Toggle
          label="IABP Active"
          hint="Intra-aortic balloon pump counterpulsation"
          checked={iabp.enabled}
          onCheckedChange={(v) => updateIABP({ enabled: v })}
        />
        {iabp.enabled && <Badge variant="success" dot size="md">IABP RUNNING — {iabp.timing}</Badge>}
        {!iabp.enabled && <Badge variant="muted">STANDBY</Badge>}
      </div>

      <div className={`${styles.body} ${!iabp.enabled ? styles.disabled : ''}`}>
        <section className={styles.section}>
          <div className={styles.grid2}>
            <Select
              label="Timing Ratio"
              value={iabp.timing}
              onValueChange={(v) => updateIABP({ timing: v as IABPTiming })}
              options={TIMING_OPTIONS}
              disabled={!iabp.enabled}
            />
            <Select
              label="Trigger Mode"
              value={iabp.triggerMode}
              onValueChange={(v) => updateIABP({ triggerMode: v as IABPTrigger })}
              options={TRIGGER_OPTIONS}
              disabled={!iabp.enabled}
            />
          </div>
          <div className={styles.grid3}>
            <Slider
              label="Augmentation"
              value={iabp.augmentation}
              min={0}
              max={100}
              unit="%"
              onValueChange={(v) => updateIABP({ augmentation: v })}
              disabled={!iabp.enabled}
              hint="Diastolic counterpulsation level"
            />
            <Input
              label="Inflation Timing"
              type="number"
              value={iabp.inflation}
              onChange={(e) => updateIABP({ inflation: parseFloat(e.target.value) || 0 })}
              unit="ms"
              disabled={!iabp.enabled}
              hint="After dicrotic notch"
            />
            <Input
              label="Deflation Timing"
              type="number"
              value={iabp.deflation}
              onChange={(e) => updateIABP({ deflation: parseFloat(e.target.value) || 0 })}
              unit="ms"
              disabled={!iabp.enabled}
              hint="Before next systole"
            />
          </div>
          <div className={styles.grid2}>
            <Input
              label="Balloon Volume"
              type="number"
              value={iabp.balloonVolume}
              onChange={(e) => updateIABP({ balloonVolume: parseFloat(e.target.value) || 0 })}
              unit="mL"
              disabled={!iabp.enabled}
              hint="Typically 30–50 mL"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
