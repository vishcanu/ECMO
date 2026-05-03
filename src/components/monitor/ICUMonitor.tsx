import React from 'react';
import styles from './ICUMonitor.module.css';
import { VitalSign } from './VitalSign';
import { WaveformDisplay } from './WaveformDisplay';
import type { Vitals, WaveformConfig } from '../../types';
import { getVitalAlarm } from './alarmUtils';

interface ICUMonitorProps {
  vitals: Vitals;
  waveforms: WaveformConfig;
  patientName?: string;
  bedNumber?: string;
  animated?: boolean;
}

export const ICUMonitor: React.FC<ICUMonitorProps> = ({
  vitals,
  waveforms,
  patientName = '---',
  bedNumber = '01',
  animated = true,
}) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={styles.monitor}>
      {/* Header Bar */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.bedLabel}>BED {bedNumber}</span>
          <span className={styles.patientName}>{patientName.toUpperCase()}</span>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.sysName}>ECMO ICU MONITORING SYSTEM</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.time}>{timeStr}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.body}>
        {/* Waveforms Column */}
        <div className={styles.waveformPanel}>
          <WaveformDisplay vitals={vitals} waveforms={waveforms} animated={animated} />
        </div>

        {/* Numerics Column */}
        <div className={styles.numericsPanel}>
          {/* HR */}
          <VitalSign
            label="HR"
            value={vitals.hr}
            unit="bpm"
            color="#00E676"
            alarm={getVitalAlarm('hr', vitals.hr)}
            size="md"
          />

          {/* BP */}
          <VitalSign
            label="ART BP"
            value={`${vitals.sbp}/${vitals.dbp}`}
            unit="mmHg"
            subValue={`MAP ${vitals.map}`}
            color="#FF5252"
            alarm={getVitalAlarm('map', vitals.map)}
            size="md"
          />

          {/* SpO2 */}
          <VitalSign
            label="SpO2"
            value={vitals.spo2}
            unit="%"
            color="#FFD740"
            alarm={getVitalAlarm('spo2', vitals.spo2)}
            size="md"
          />

          {/* RR */}
          <VitalSign
            label="RR"
            value={vitals.rr}
            unit="/min"
            color="#40C4FF"
            alarm={getVitalAlarm('rr', vitals.rr)}
            size="sm"
          />

          {/* Temp */}
          <VitalSign
            label="TEMP"
            value={vitals.temperature.toFixed(1)}
            unit="°C"
            color="#FF80AB"
            alarm={getVitalAlarm('temperature', vitals.temperature)}
            size="sm"
          />

          {/* CVP */}
          <VitalSign
            label="CVP"
            value={vitals.cvp}
            unit="mmHg"
            color="#40C4FF"
            alarm={getVitalAlarm('cvp', vitals.cvp)}
            size="sm"
          />

          {/* PAP */}
          <VitalSign
            label="PAP"
            value={`${vitals.pap.sys}/${vitals.pap.dia}`}
            unit="mmHg"
            subValue={`Mean ${vitals.pap.mean}`}
            color="#CE93D8"
            alarm={getVitalAlarm('pap_mean', vitals.pap.mean)}
            size="sm"
          />

          {/* EtCO2 */}
          <VitalSign
            label="EtCO2"
            value={vitals.etco2}
            unit="mmHg"
            color="#B9F6CA"
            alarm={getVitalAlarm('etco2', vitals.etco2)}
            size="sm"
          />

          {/* Ventilator pressures */}
          <VitalSign
            label="PIP"
            value={vitals.pip}
            unit="cmH₂O"
            color="#80D8FF"
            size="sm"
          />

          <VitalSign
            label="PEEP"
            value={vitals.peep}
            unit="cmH₂O"
            color="#80D8FF"
            size="sm"
          />
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>RHYTHM</span>
          <span className={styles.footerValue} style={{ color: '#00E676' }}>
            {waveforms.ecg.rhythm.toUpperCase()}
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>ST</span>
          <span
            className={styles.footerValue}
            style={{ color: Math.abs(waveforms.ecg.stChanges) > 1 ? '#FF9800' : '#64748B' }}
          >
            {waveforms.ecg.stChanges > 0 ? '+' : ''}{waveforms.ecg.stChanges.toFixed(1)} mm
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>QRS</span>
          <span className={styles.footerValue} style={{ color: '#64748B' }}>
            {waveforms.ecg.qrsWidth} ms
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>PULSE PRESSURE</span>
          <span className={styles.footerValue} style={{ color: '#FF5252' }}>
            {vitals.sbp - vitals.dbp} mmHg
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>PI</span>
          <span className={styles.footerValue} style={{ color: '#FFD740' }}>
            {(waveforms.spo2Pleth.perfusionIndex ?? 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
