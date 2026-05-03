import React from 'react';
import styles from './VitalsModule.module.css';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Slider } from '../../components/ui/Slider';
import { useScenarioStore } from '../../store/scenarioStore';
import { useDifficultyGates } from '../../hooks/useDifficultyGates';
import type { ECGRhythm } from '../../types';
import {
  Heart, Activity, Thermometer, Wind,
  Waves, Monitor, Radio, Lock
} from 'lucide-react';

const ALL_RHYTHM_OPTIONS: { value: ECGRhythm; label: string }[] = [
  { value: 'sinus',         label: 'Normal Sinus Rhythm' },
  { value: 'af',            label: 'Atrial Fibrillation (AF)' },
  { value: 'vt',            label: 'Ventricular Tachycardia (VT)' },
  { value: 'vf',            label: 'Ventricular Fibrillation (VF)' },
  { value: 'svt',           label: 'Supraventricular Tachycardia (SVT)' },
  { value: 'bradycardia',   label: 'Sinus Bradycardia' },
  { value: 'heart-block-2', label: '2nd Degree Heart Block' },
  { value: 'heart-block-3', label: '3rd Degree Heart Block' },
  { value: 'paced',         label: 'Paced Rhythm' },
];

const BASIC_RHYTHM_OPTIONS: { value: ECGRhythm; label: string }[] = [
  { value: 'sinus',       label: 'Normal Sinus Rhythm' },
  { value: 'bradycardia', label: 'Sinus Bradycardia' },
  { value: 'svt',         label: 'Supraventricular Tachycardia (SVT)' },
];

const DAMPING_OPTIONS = [
  { value: 'normal', label: 'Normal Damping' },
  { value: 'over', label: 'Over-damped' },
  { value: 'under', label: 'Under-damped' },
];

export const VitalsModule: React.FC = () => {
  const vitals = useScenarioStore((s) => s.activeScenario.vitals);
  const waveforms = useScenarioStore((s) => s.activeScenario.waveforms);
  const updateVitals = useScenarioStore((s) => s.updateVitals);
  const updateWaveforms = useScenarioStore((s) => s.updateWaveforms);
  const { showPAP, showCVP, fullRhythms, waveformEditing } = useDifficultyGates();
  const rhythmOptions = fullRhythms ? ALL_RHYTHM_OPTIONS : BASIC_RHYTHM_OPTIONS;

  // If current rhythm is not in the allowed list, it will still display but won't match any option
  // — this is fine; the value is preserved, just can't pick new complex rhythms at basic level.

  return (
    <div className={styles.root}>
      {/* ── Hemodynamics ───────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heart size={15} className={styles.sectionIcon} />
          <h3>Hemodynamics</h3>
        </div>
        <div className={styles.grid3}>
          <Slider label="Heart Rate" value={vitals.hr} min={20} max={250} unit="bpm"
            onValueChange={(v) => updateVitals({ hr: v })} />
          <Slider label="SBP" value={vitals.sbp} min={40} max={280} unit="mmHg"
            onValueChange={(v) => updateVitals({ sbp: v, map: Math.round(vitals.dbp + (v - vitals.dbp) / 3) })} />
          <Slider label="DBP" value={vitals.dbp} min={20} max={180} unit="mmHg"
            onValueChange={(v) => updateVitals({ dbp: v, map: Math.round(v + (vitals.sbp - v) / 3) })} />
        </div>
        <div className={styles.grid3}>
          <div className={styles.derivedValue}>
            <span className={styles.derivedLabel}>MAP (derived)</span>
            <span className={styles.derivedNumber}>{vitals.map}</span>
            <span className={styles.derivedUnit}>mmHg</span>
          </div>
          <Slider label="CVP" value={vitals.cvp} min={-5} max={30} unit="mmHg"
            onValueChange={(v) => updateVitals({ cvp: v })} disabled={!showCVP}
            hint={!showCVP ? 'Unlocks at Intermediate' : undefined} />
          <Slider label="Pulse Pressure" value={vitals.sbp - vitals.dbp} min={10} max={120} unit="mmHg"
            onValueChange={(v) => updateVitals({ sbp: vitals.dbp + v })} hint="SBP – DBP" />
        </div>
      </section>

      {/* ── Pulmonary Artery ────────────────────────── */}
      {showPAP ? (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Waves size={15} className={styles.sectionIcon} />
          <h3>Pulmonary Artery Pressure</h3>
        </div>
        <div className={styles.grid3}>
          <Slider label="PAP Systolic" value={vitals.pap.sys} min={10} max={120} unit="mmHg"
            onValueChange={(v) => updateVitals({ pap: { ...vitals.pap, sys: v, mean: Math.round(vitals.pap.dia + (v - vitals.pap.dia) / 3) } })} />
          <Slider label="PAP Diastolic" value={vitals.pap.dia} min={5} max={80} unit="mmHg"
            onValueChange={(v) => updateVitals({ pap: { ...vitals.pap, dia: v, mean: Math.round(v + (vitals.pap.sys - v) / 3) } })} />
          <div className={styles.derivedValue}>
            <span className={styles.derivedLabel}>PAP Mean (derived)</span>
            <span className={styles.derivedNumber}>{vitals.pap.mean}</span>
            <span className={styles.derivedUnit}>mmHg</span>
          </div>
        </div>
      </section>
      ) : (
        <div className={styles.lockedSection}>
          <Lock size={13} />
          <span>Pulmonary Artery Pressure — unlocks at <strong>Advanced</strong></span>
        </div>
      )}

      {/* ── Respiratory ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Wind size={15} className={styles.sectionIcon} />
          <h3>Respiratory</h3>
        </div>
        <div className={styles.grid3}>
          <Slider label="SpO2" value={vitals.spo2} min={50} max={100} unit="%"
            onValueChange={(v) => updateVitals({ spo2: v })} />
          <Slider label="Respiratory Rate" value={vitals.rr} min={4} max={60} unit="/min"
            onValueChange={(v) => updateVitals({ rr: v })} />
          <Slider label="EtCO2" value={vitals.etco2} min={10} max={80} unit="mmHg"
            onValueChange={(v) => updateVitals({ etco2: v })} />
        </div>
        <div className={styles.grid3}>
          <Slider label="PIP" value={vitals.pip} min={5} max={60} unit="cmH₂O"
            onValueChange={(v) => updateVitals({ pip: v })} />
          <Slider label="PEEP" value={vitals.peep} min={0} max={25} unit="cmH₂O"
            onValueChange={(v) => updateVitals({ peep: v })} />
          <Slider label="Temperature" value={vitals.temperature} min={30} max={42} step={0.1} unit="°C"
            onValueChange={(v) => updateVitals({ temperature: v })}
            formatValue={(v) => v.toFixed(1)} />
        </div>
      </section>

      {/* ── ECG Waveform ────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Activity size={15} className={styles.sectionIcon} />
          <h3>ECG Configuration</h3>
        </div>
        <div className={styles.grid3}>
          <Select
            label="ECG Rhythm"
            value={waveforms.ecg.rhythm}
            onValueChange={(v) => updateWaveforms({ ecg: { ...waveforms.ecg, rhythm: v as ECGRhythm } })}
            options={rhythmOptions}
          />
          {!fullRhythms && (
            <div className={styles.rhythmLockHint}>
              <Lock size={11} />
              Advanced rhythms (AF, VT, VF, blocks) unlock at Intermediate
            </div>
          )}
          <Slider
            label="ST Changes"
            value={waveforms.ecg.stChanges}
            min={-5}
            max={5}
            step={0.5}
            unit="mm"
            onValueChange={(v) => updateWaveforms({ ecg: { ...waveforms.ecg, stChanges: v } })}
            hint="Positive = elevation, Negative = depression"
            formatValue={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
          />
          <Slider
            label="QRS Width"
            value={waveforms.ecg.qrsWidth}
            min={40}
            max={200}
            unit="ms"
            onValueChange={(v) => updateWaveforms({ ecg: { ...waveforms.ecg, qrsWidth: v } })}
            hint=">120ms = wide complex"
          />
        </div>
      </section>

      {/* ── Arterial Line ───────────────────────────── */}
      {waveformEditing ? (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Monitor size={15} className={styles.sectionIcon} />
          <h3>Arterial Line Waveform</h3>
        </div>
        <div className={styles.grid3}>
          <Select
            label="Damping"
            value={waveforms.arterialLine.damping}
            onValueChange={(v) =>
              updateWaveforms({ arterialLine: { ...waveforms.arterialLine, damping: v as 'normal' | 'over' | 'under' } })
            }
            options={DAMPING_OPTIONS}
          />
          <Slider
            label="Respiratory Variation"
            value={waveforms.arterialLine.respiratoryVariation}
            min={0}
            max={30}
            unit="%"
            onValueChange={(v) => updateWaveforms({ arterialLine: { ...waveforms.arterialLine, respiratoryVariation: v } })}
            hint=">13% suggests fluid responsiveness"
          />
          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={waveforms.arterialLine.dicroticNotch}
                onChange={(e) =>
                  updateWaveforms({ arterialLine: { ...waveforms.arterialLine, dicroticNotch: e.target.checked } })
                }
              />
              Dicrotic Notch Visible
            </label>
          </div>
        </div>
      </section>
      ) : (
        <div className={styles.lockedSection}>
          <Lock size={13} />
          <span>Arterial Line Waveform fine-tuning — unlocks at <strong>Expert</strong></span>
        </div>
      )}

      {/* ── CVP Waveform ────────────────────────────── */}
      {waveformEditing && showCVP ? (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Radio size={15} className={styles.sectionIcon} />
          <h3>CVP Waveform Components</h3>
        </div>
        <div className={styles.grid3}>
          <Slider
            label="a-Wave Amplitude"
            value={waveforms.cvp.aWaveAmplitude}
            min={0}
            max={20}
            unit="mmHg"
            onValueChange={(v) => updateWaveforms({ cvp: { ...waveforms.cvp, aWaveAmplitude: v } })}
            hint="Atrial contraction (absent in AF)"
          />
          <Slider
            label="v-Wave Amplitude"
            value={waveforms.cvp.vWaveAmplitude}
            min={0}
            max={20}
            unit="mmHg"
            onValueChange={(v) => updateWaveforms({ cvp: { ...waveforms.cvp, vWaveAmplitude: v } })}
            hint="Large v-wave = TR or tamponade"
          />
          <Slider
            label="SpO2 Pleth Amplitude"
            value={waveforms.spo2Pleth.amplitude}
            min={10}
            max={100}
            unit="%"
            onValueChange={(v) => updateWaveforms({ spo2Pleth: { ...waveforms.spo2Pleth, amplitude: v } })}
          />
        </div>
      </section>
      ) : !waveformEditing ? (
        <div className={styles.lockedSection}>
          <Lock size={13} />
          <span>CVP Waveform &amp; SpO2 Pleth fine-tuning — unlocks at <strong>Expert</strong></span>
        </div>
      ) : null}

      {/* ── Thermometer ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Thermometer size={15} className={styles.sectionIcon} />
          <h3>Temperature Management</h3>
        </div>
        <div className={styles.grid3}>
          <Input
            label="Core Temperature"
            type="number"
            value={vitals.temperature}
            onChange={(e) => updateVitals({ temperature: parseFloat(e.target.value) || 37 })}
            unit="°C"
            min={30}
            max={42}
            step={0.1}
            hint="Normal: 36.5–37.5°C"
          />
          <div className={styles.tempBadges}>
            <span className={styles.tempHint}>
              {vitals.temperature >= 38 ? '🔥 Fever' : vitals.temperature < 35 ? '❄️ Hypothermia' : 'Normothermic'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
