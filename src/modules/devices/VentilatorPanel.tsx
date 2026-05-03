import React from 'react';
import styles from './VentilatorPanel.module.css';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { VentMode } from '../../types';
import { calculateTidalVolumeTarget } from '../../engine/physiology/physiologyCalculations';
import { Info, Wind } from 'lucide-react';

const VENT_MODE_OPTIONS: { value: VentMode; label: string }[] = [
  { value: 'VC-AC', label: 'VC-AC (Volume Control - Assist Control)' },
  { value: 'PC-AC', label: 'PC-AC (Pressure Control - Assist Control)' },
  { value: 'SIMV-VC', label: 'SIMV-VC (Volume)' },
  { value: 'SIMV-PC', label: 'SIMV-PC (Pressure)' },
  { value: 'APRV', label: 'APRV (Airway Pressure Release Ventilation)' },
  { value: 'PSV', label: 'PSV (Pressure Support Ventilation)' },
  { value: 'CPAP', label: 'CPAP' },
];

export const VentilatorPanel: React.FC = () => {
  const ventilator = useScenarioStore((s) => s.activeScenario.devices.ventilator);
  const demographics = useScenarioStore((s) => s.activeScenario.demographics);
  const updateVentilator = useScenarioStore((s) => s.updateVentilator);

  const targetTV = calculateTidalVolumeTarget(demographics.height, demographics.sex);
  const mlPerKg = demographics.weight > 0 ? (ventilator.tidalVolume / demographics.weight).toFixed(1) : '—';
  const isAPRV = ventilator.mode === 'APRV';
  const isPSV = ventilator.mode === 'PSV' || ventilator.mode === 'CPAP';

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <Toggle
          label="Ventilator Active"
          hint="Patient is mechanically ventilated"
          checked={ventilator.enabled}
          onCheckedChange={(v) => updateVentilator({ enabled: v })}
        />
        {ventilator.enabled && (
          <Badge variant="success" size="md" dot>{ventilator.mode}</Badge>
        )}
      </div>

      <div className={`${styles.body} ${!ventilator.enabled ? styles.disabled : ''}`}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Wind size={14} />
            <span>Mode &amp; Basic Settings</span>
          </div>
          <div className={styles.grid3}>
            <Select
              label="Ventilator Mode"
              value={ventilator.mode}
              onValueChange={(v) => updateVentilator({ mode: v as VentMode })}
              options={VENT_MODE_OPTIONS}
              disabled={!ventilator.enabled}
            />
            {!isAPRV && !isPSV && (
              <Slider
                label="Tidal Volume"
                value={ventilator.tidalVolume}
                min={200}
                max={900}
                step={10}
                unit="mL"
                onValueChange={(v) => updateVentilator({ tidalVolume: v })}
                disabled={!ventilator.enabled}
                hint={`${mlPerKg} mL/kg IBW | Target: ${targetTV} mL`}
              />
            )}
            {!isAPRV && (
              <Slider
                label="Respiratory Rate"
                value={ventilator.respiratoryRate}
                min={4}
                max={40}
                unit="/min"
                onValueChange={(v) => updateVentilator({ respiratoryRate: v })}
                disabled={!ventilator.enabled}
              />
            )}
          </div>
          <div className={styles.grid3}>
            <Slider
              label="PEEP"
              value={ventilator.peep}
              min={0}
              max={25}
              unit="cmH₂O"
              onValueChange={(v) => updateVentilator({ peep: v })}
              disabled={!ventilator.enabled}
            />
            <Slider
              label="FiO2"
              value={Math.round(ventilator.fio2 * 100)}
              min={21}
              max={100}
              unit="%"
              onValueChange={(v) => updateVentilator({ fio2: v / 100 })}
              disabled={!ventilator.enabled}
            />
            {isPSV && (
              <Slider
                label="Pressure Support"
                value={ventilator.pSupport}
                min={0}
                max={30}
                unit="cmH₂O"
                onValueChange={(v) => updateVentilator({ pSupport: v })}
                disabled={!ventilator.enabled}
              />
            )}
          </div>
        </section>

        {/* APRV Settings */}
        {isAPRV && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Wind size={14} />
              <span>APRV Settings</span>
            </div>
            <div className={styles.grid4}>
              <Input
                label="P-High"
                type="number"
                value={ventilator.pHigh}
                onChange={(e) => updateVentilator({ pHigh: parseFloat(e.target.value) || 0 })}
                unit="cmH₂O"
                disabled={!ventilator.enabled}
                hint="Typically 25–35"
              />
              <Input
                label="P-Low"
                type="number"
                value={ventilator.pLow}
                onChange={(e) => updateVentilator({ pLow: parseFloat(e.target.value) || 0 })}
                unit="cmH₂O"
                disabled={!ventilator.enabled}
                hint="Usually 0"
              />
              <Input
                label="T-High"
                type="number"
                value={ventilator.tHigh}
                onChange={(e) => updateVentilator({ tHigh: parseFloat(e.target.value) || 0 })}
                unit="sec"
                disabled={!ventilator.enabled}
                hint="Typically 4–6s"
                step={0.1}
              />
              <Input
                label="T-Low"
                type="number"
                value={ventilator.tLow}
                onChange={(e) => updateVentilator({ tLow: parseFloat(e.target.value) || 0 })}
                unit="sec"
                disabled={!ventilator.enabled}
                hint="Typically 0.4–0.8s"
                step={0.1}
              />
            </div>
          </section>
        )}

        {/* Pressures */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Info size={14} />
            <span>Airway Pressures</span>
          </div>
          <div className={styles.grid3}>
            <Input
              label="Peak Inspiratory Pressure"
              type="number"
              value={ventilator.pip}
              onChange={(e) => updateVentilator({ pip: parseFloat(e.target.value) || 0 })}
              unit="cmH₂O"
              disabled={!ventilator.enabled}
              hint="PIP &lt;35 cmH₂O recommended"
            />
            <Input
              label="Plateau Pressure"
              type="number"
              value={ventilator.plateauPressure}
              onChange={(e) => updateVentilator({ plateauPressure: parseFloat(e.target.value) || 0 })}
              unit="cmH₂O"
              disabled={!ventilator.enabled}
              hint="Pplat &lt;30 cmH₂O (ARDSNet)"
            />
            <div className={styles.derivedBox}>
              <span className={styles.derivedLabel}>Driving Pressure</span>
              <span className={styles.derivedValue}>
                {ventilator.plateauPressure - ventilator.peep}
              </span>
              <span className={styles.derivedUnit}>cmH₂O</span>
              <span className={styles.derivedHint}>Target &lt;15 cmH₂O</span>
            </div>
          </div>
        </section>

        {/* ARDSNet guidance */}
        {ventilator.enabled && (
          <div className={styles.infoBox}>
            <Info size={13} />
            <span>
              <strong>ARDSNet:</strong> TV 6 mL/kg IBW | Pplat &le;30 | PEEP-FiO₂ table applies.
              {ventilator.tidalVolume > targetTV * 1.2 && (
                <span className={styles.warningText}> Warning: Tidal volume exceeds 6 mL/kg IBW target ({targetTV} mL).</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
