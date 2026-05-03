import React from 'react';
import styles from './ECMOPanel.module.css';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { ECMOMode } from '../../types';
import { Info, RefreshCw, Gauge, Droplets, Wind, Zap } from 'lucide-react';

const ECMO_MODE_OPTIONS = [
  { value: 'VV', label: 'VV-ECMO (Respiratory Support)' },
  { value: 'VA', label: 'VA-ECMO (Cardiac + Respiratory)' },
  { value: 'VAV', label: 'VAV-ECMO (Combined)' },
];

const CANNULA_OPTIONS_ARTERIAL = ['12Fr', '14Fr', '15Fr', '16Fr', '17Fr', '18Fr', '19Fr', '20Fr'];
const CANNULA_OPTIONS_VENOUS = ['19Fr', '21Fr', '23Fr', '25Fr', '27Fr', '29Fr', '31Fr'];

export const ECMOPanel: React.FC = () => {
  const ecmo = useScenarioStore((s) => s.activeScenario.devices.ecmo);
  const updateECMO = useScenarioStore((s) => s.updateECMO);

  const membraneEfficiency = ecmo.enabled
    ? Math.round(((ecmo.postMembraneO2 - ecmo.preMembraneO2) / (500 - ecmo.preMembraneO2)) * 100)
    : 0;

  return (
    <div className={styles.root}>
      {/* Enable / Mode row */}
      <div className={styles.topRow}>
        <Toggle
          label="ECMO Active"
          hint="Enables ECMO physiological effects"
          checked={ecmo.enabled}
          onCheckedChange={(v) => updateECMO({ enabled: v })}
        />
        {ecmo.enabled && (
          <Badge variant="success" size="md" dot>
            {ecmo.mode}-ECMO RUNNING
          </Badge>
        )}
        {!ecmo.enabled && (
          <Badge variant="muted" size="md">
            STANDBY
          </Badge>
        )}
      </div>

      <div className={`${styles.body} ${!ecmo.enabled ? styles.disabled : ''}`}>
        {/* Mode + Cannula */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <RefreshCw size={14} className={styles.sectionIcon} />
            <span>Circuit Configuration</span>
          </div>
          <div className={styles.grid3}>
            <Select
              label="ECMO Mode"
              value={ecmo.mode}
              onValueChange={(v) => updateECMO({ mode: v as ECMOMode })}
              options={ECMO_MODE_OPTIONS}
              disabled={!ecmo.enabled}
            />
            <Select
              label="Arterial Cannula"
              value={ecmo.cannulaArterial}
              onValueChange={(v) => updateECMO({ cannulaArterial: v })}
              options={CANNULA_OPTIONS_ARTERIAL.map((s) => ({ value: s, label: s }))}
              disabled={!ecmo.enabled || ecmo.mode === 'VV'}
              hint={ecmo.mode === 'VV' ? 'Not used in VV-ECMO' : undefined}
            />
            <Select
              label="Venous Cannula"
              value={ecmo.cannulaVenous}
              onValueChange={(v) => updateECMO({ cannulaVenous: v })}
              options={CANNULA_OPTIONS_VENOUS.map((s) => ({ value: s, label: s }))}
              disabled={!ecmo.enabled}
            />
          </div>
        </section>

        {/* Pump Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Gauge size={14} className={styles.sectionIcon} />
            <span>Pump Settings</span>
          </div>
          <div className={styles.grid3}>
            <Slider
              label="Blood Flow"
              value={ecmo.flow}
              min={0.5}
              max={8}
              step={0.1}
              unit="L/min"
              onValueChange={(v) => updateECMO({ flow: v })}
              disabled={!ecmo.enabled}
              hint="Target: 60–80 mL/kg/min"
              formatValue={(v) => v.toFixed(1)}
            />
            <Slider
              label="RPM"
              value={ecmo.rpm}
              min={500}
              max={6000}
              step={50}
              unit="rpm"
              onValueChange={(v) => updateECMO({ rpm: v })}
              disabled={!ecmo.enabled}
            />
            <Slider
              label="Delta Pressure"
              value={ecmo.deltaPressure}
              min={0}
              max={100}
              unit="mmHg"
              onValueChange={(v) => updateECMO({ deltaPressure: v })}
              disabled={!ecmo.enabled}
              hint="Pre − Post membrane pressure"
            />
          </div>
        </section>

        {/* Gas Exchange */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Wind size={14} className={styles.sectionIcon} />
            <span>Gas Exchange</span>
          </div>
          <div className={styles.grid3}>
            <Slider
              label="Sweep Gas Flow"
              value={ecmo.sweepGas}
              min={0}
              max={15}
              step={0.5}
              unit="L/min"
              onValueChange={(v) => updateECMO({ sweepGas: v })}
              disabled={!ecmo.enabled}
              hint="CO2 removal rate"
              formatValue={(v) => v.toFixed(1)}
            />
            <Slider
              label="FiO2 (ECMO)"
              value={Math.round(ecmo.fio2Ecmo * 100)}
              min={21}
              max={100}
              unit="%"
              onValueChange={(v) => updateECMO({ fio2Ecmo: v / 100 })}
              disabled={!ecmo.enabled}
            />
            <Input
              label="Heparin Infusion"
              type="number"
              value={ecmo.heparinDose}
              onChange={(e) => updateECMO({ heparinDose: parseFloat(e.target.value) || 0 })}
              unit="IU/hr"
              disabled={!ecmo.enabled}
              hint="Target ACT 160–220s"
            />
          </div>
        </section>

        {/* Membrane Oxygenator */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Droplets size={14} className={styles.sectionIcon} />
            <span>Membrane Oxygenator Values</span>
          </div>
          <div className={styles.grid4}>
            <Input
              label="Pre-Membrane PO2"
              type="number"
              value={ecmo.preMembraneO2}
              onChange={(e) => updateECMO({ preMembraneO2: parseFloat(e.target.value) || 0 })}
              unit="mmHg"
              disabled={!ecmo.enabled}
              hint="Venous blood"
            />
            <Input
              label="Post-Membrane PO2"
              type="number"
              value={ecmo.postMembraneO2}
              onChange={(e) => updateECMO({ postMembraneO2: parseFloat(e.target.value) || 0 })}
              unit="mmHg"
              disabled={!ecmo.enabled}
              hint="Arterial blood"
            />
            <Input
              label="Pre-Membrane SatO2"
              type="number"
              value={ecmo.preMembraneO2Sat}
              onChange={(e) => updateECMO({ preMembraneO2Sat: parseFloat(e.target.value) || 0 })}
              unit="%"
              disabled={!ecmo.enabled}
            />
            <Input
              label="Post-Membrane SatO2"
              type="number"
              value={ecmo.postMembraneO2Sat}
              onChange={(e) => updateECMO({ postMembraneO2Sat: parseFloat(e.target.value) || 0 })}
              unit="%"
              disabled={!ecmo.enabled}
            />
          </div>

          {/* Membrane efficiency gauge */}
          {ecmo.enabled && (
            <div className={styles.efficiencyRow}>
              <div className={styles.efficiencyLabel}>
                <Zap size={12} />
                Membrane Efficiency
              </div>
              <div className={styles.efficiencyBar}>
                <div
                  className={styles.efficiencyFill}
                  style={{
                    width: `${Math.max(0, Math.min(membraneEfficiency, 100))}%`,
                    background: membraneEfficiency > 70 ? '#22C55E' : membraneEfficiency > 40 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span className={styles.efficiencyValue}>{membraneEfficiency}%</span>
            </div>
          )}
        </section>

        {/* ELSO Guidance Note */}
        {ecmo.enabled && (
          <div className={styles.infoBox}>
            <Info size={13} />
            <span>
              <strong>ELSO Guidance:</strong> Maintain flow at 60–80 mL/kg/min. Target SvO2 &gt;70%.
              ACT 160–220s on heparin. Check for hemolysis (LDH, free Hb) every 6 hours.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
