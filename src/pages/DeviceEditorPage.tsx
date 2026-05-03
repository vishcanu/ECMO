import React, { useState, useEffect } from 'react';
import styles from './DeviceEditorPage.module.css';
import { ECMOPanel } from '../modules/devices/ECMOPanel';
import { VentilatorPanel } from '../modules/devices/VentilatorPanel';
import { IABPPanel } from '../modules/devices/IABPPanel';
import { DefibrillatorPanel } from '../modules/devices/DefibrillatorPanel';
import { useScenarioStore } from '../store/scenarioStore';
import { useDeviceSync } from '../hooks/useDeviceSync';
import { RefreshCw, Wind, Activity, Zap, CheckCircle } from 'lucide-react';

const DEVICE_TABS = [
  { id: 'ecmo',          label: 'ECMO',          icon: <RefreshCw size={15} /> },
  { id: 'ventilator',    label: 'Ventilator',    icon: <Wind size={15} /> },
  { id: 'iabp',          label: 'IABP',          icon: <Activity size={15} /> },
  { id: 'defibrillator', label: 'Defibrillator', icon: <Zap size={15} /> },
] as const;

type DeviceId = typeof DEVICE_TABS[number]['id'];

function getInitialTab(): DeviceId {
  const params = new URLSearchParams(window.location.search);
  const d = params.get('device') as DeviceId | null;
  return d && DEVICE_TABS.some((t) => t.id === d) ? d : 'ecmo';
}

export const DeviceEditorPage: React.FC = () => {
  // Cross-tab sync — must be mounted here too
  useDeviceSync();

  const [activeTab, setActiveTab] = useState<DeviceId>(getInitialTab);
  const [saved, setSaved] = useState(false);

  const scenarioName = useScenarioStore((s) => s.activeScenario.name);
  const patientName  = useScenarioStore((s) => s.activeScenario.demographics.name);
  const devices      = useScenarioStore((s) => s.activeScenario.devices);

  // Show a brief "synced" indicator after any device change
  useEffect(() => {
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  return (
    <div className={styles.root}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <RefreshCw size={18} />
          </div>
          <div>
            <div className={styles.headerTitle}>Device Configuration</div>
            <div className={styles.headerSub}>
              {scenarioName || 'Unnamed Scenario'}
              {patientName ? ` · ${patientName}` : ''}
            </div>
          </div>
        </div>
        {saved && (
          <div className={styles.syncBadge}>
            <CheckCircle size={13} />
            Synced to preview
          </div>
        )}
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <nav className={styles.tabBar}>
        {DEVICE_TABS.map(({ id, label, icon }) => {
          const isActive =
            id === 'ecmo'          ? devices.ecmo.enabled :
            id === 'ventilator'    ? devices.ventilator.enabled :
            id === 'iabp'          ? devices.iabp.enabled :
            false;
          return (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {icon}
              <span>{label}</span>
              {isActive && <span className={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      {/* ── Panel content ───────────────────────────────────────────── */}
      <div className={styles.panelWrap}>
        {activeTab === 'ecmo'          && <ECMOPanel />}
        {activeTab === 'ventilator'    && <VentilatorPanel />}
        {activeTab === 'iabp'          && <IABPPanel />}
        {activeTab === 'defibrillator' && <DefibrillatorPanel />}
      </div>
    </div>
  );
};
