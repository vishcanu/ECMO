import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styles from './PreviewModal.module.css';
import { ICUMonitor } from '../../components/monitor/ICUMonitor';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import { X, FlaskConical, Image, RefreshCw, Wind, Activity, Pill, ExternalLink } from 'lucide-react';
import type { LabFlag, LabParameter } from '../../types';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

const LAB_PANEL_LABELS: { key: string; label: string }[] = [
  { key: 'hematology',     label: 'Hematology' },
  { key: 'biochemistry',   label: 'Biochemistry' },
  { key: 'abg',            label: 'ABG' },
  { key: 'coagulation',    label: 'Coagulation' },
  { key: 'cardiacMarkers', label: 'Cardiac Markers' },
  { key: 'infection',      label: 'Infection' },
  { key: 'icuEcmo',        label: 'ICU / ECMO' },
];

function flagChipClass(flag: LabFlag, s: Record<string, string>): string {
  if (flag === 'critical-high') return s.flagCritHigh;
  if (flag === 'critical-low')  return s.flagCritLow;
  if (flag === 'high')          return s.flagHigh;
  if (flag === 'low')           return s.flagLow;
  return '';
}

function flagLabel(flag: LabFlag): string {
  if (flag === 'critical-high') return '\u2191\u2191 CRIT';
  if (flag === 'critical-low')  return '\u2193\u2193 CRIT';
  if (flag === 'high')          return 'HIGH \u2191';
  if (flag === 'low')           return 'LOW \u2193';
  return '';
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ open, onClose }) => {
  const scenario = useScenarioStore((s) => s.activeScenario);
  const simulationPreview = useScenarioStore((s) => s.simulationPreview);
  const clearSimulationPreview = useScenarioStore((s) => s.clearSimulationPreview);
  const runSim = useScenarioStore((s) => s.runSimulationEngine);

  // Authored mode: show exactly what the user configured.
  // Simulation mode: show engine-computed values (devices + drugs + labs applied).
  const isSimMode = simulationPreview !== null;
  const displayVitals = isSimMode ? simulationPreview!.vitals : scenario.vitals;
  const displayWaveforms = isSimMode ? simulationPreview!.waveforms : scenario.waveforms;

  const [labsOpen, setLabsOpen] = React.useState(false);
  const [labActivePanel, setLabActivePanel] = React.useState('hematology');
  const [imagingOpen, setImagingOpen] = React.useState(false);

  const openDeviceEditor = (device: string) => {
    window.open(`/device-editor.html?device=${device}`, 'ecmo-device-editor',
      'width=960,height=780,resizable=yes,scrollbars=yes');
  };
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Clear simulation preview when modal closes so next open shows authored values
  const handleClose = () => {
    clearSimulationPreview();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerTitle}>SCENARIO PREVIEW</span>
              <span className={styles.patientBadge}>
                {scenario.demographics.name || 'Unnamed Patient'} · UHID: {scenario.demographics.uhid || '—'}
              </span>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.scenarioBadge}>
                <Badge variant="info">{scenario.difficulty.toUpperCase()}</Badge>
                <Badge variant="default">{scenario.category}</Badge>
              </div>
              {/* Mode badge */}
              {isSimMode ? (
                <button
                  className={styles.modeBadgeSim}
                  onClick={clearSimulationPreview}
                  title="Click to return to authored values"
                >
                  <RefreshCw size={11} />
                  Simulation mode — click to reset
                </button>
              ) : (
                <button
                  className={styles.runSimBtn}
                  onClick={runSim}
                  title="Apply device/drug/lab effects to vitals"
                >
                  <RefreshCw size={14} />
                  Run Simulation
                </button>
              )}
              <Dialog.Close asChild>
                <button className={styles.closeBtn} onClick={handleClose}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Main body */}
          <div className={styles.body}>
            {/* ICU Monitor */}
            <div className={styles.monitorSection}>
              <ICUMonitor
                vitals={displayVitals}
                waveforms={displayWaveforms}
                patientName={scenario.demographics.name}
                bedNumber="01"
                animated
              />
            </div>

            {/* Info Panels Row */}
            <div className={styles.infoRow}>
              {/* Patient Info */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <Activity size={13} />
                  <span>Patient</span>
                </div>
                <div className={styles.infoGrid}>
                  <span className={styles.infoKey}>Age / Sex</span>
                  <span className={styles.infoVal}>{scenario.demographics.age}y / {scenario.demographics.sex}</span>
                  <span className={styles.infoKey}>Wt / Ht</span>
                  <span className={styles.infoVal}>{scenario.demographics.weight}kg / {scenario.demographics.height}cm</span>
                  <span className={styles.infoKey}>BMI</span>
                  <span className={styles.infoVal}>{scenario.demographics.bmi}</span>
                  <span className={styles.infoKey}>BSA</span>
                  <span className={styles.infoVal}>{scenario.demographics.bsa} m²</span>
                  <span className={styles.infoKey}>Diagnosis</span>
                  <span className={styles.infoVal}>{scenario.demographics.diagnosis || '—'}</span>
                </div>
              </div>

              {/* Active Devices */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <Wind size={13} />
                  <span>Active Devices</span>
                </div>
                <div className={styles.deviceList}>
                  {scenario.devices.ecmo.enabled && (
                    <button className={styles.deviceItem} onClick={() => openDeviceEditor('ecmo')}>
                      <RefreshCw size={12} />
                      <span>{scenario.devices.ecmo.mode}-ECMO</span>
                      <Badge variant="success">{scenario.devices.ecmo.flow.toFixed(1)} L/min</Badge>
                      <ExternalLink size={11} className={styles.deviceChevron} />
                    </button>
                  )}
                  {scenario.devices.ventilator.enabled && (
                    <button className={styles.deviceItem} onClick={() => openDeviceEditor('ventilator')}>
                      <Wind size={12} />
                      <span>Ventilator {scenario.devices.ventilator.mode}</span>
                      <Badge variant="info">TV {scenario.devices.ventilator.tidalVolume} mL</Badge>
                      <ExternalLink size={11} className={styles.deviceChevron} />
                    </button>
                  )}
                  {scenario.devices.iabp.enabled && (
                    <button className={styles.deviceItem} onClick={() => openDeviceEditor('iabp')}>
                      <Activity size={12} />
                      <span>IABP {scenario.devices.iabp.timing}</span>
                      <Badge variant="warning">{scenario.devices.iabp.augmentation}% Aug</Badge>
                      <ExternalLink size={11} className={styles.deviceChevron} />
                    </button>
                  )}
                  {!scenario.devices.ecmo.enabled && !scenario.devices.ventilator.enabled && !scenario.devices.iabp.enabled && (
                    <span className={styles.noDevices}>No devices active</span>
                  )}
                  <button className={styles.deviceAddBtn} onClick={() => openDeviceEditor('ecmo')}>
                    <ExternalLink size={11} />
                    Open Device Editor
                  </button>
                </div>
              </div>

              {/* Medications */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <Pill size={13} />
                  <span>Medications ({scenario.drugState.drugs.length})</span>
                </div>
                <div className={styles.drugList}>
                  {scenario.drugState.drugs.slice(0, 5).map((d) => (
                    <div key={d.id} className={styles.drugItem}>
                      <span className={styles.drugName}>{d.name || 'Unnamed'}</span>
                      <span className={styles.drugDose}>{d.dose} {d.unit}</span>
                    </div>
                  ))}
                  {scenario.drugState.drugs.length > 5 && (
                    <span className={styles.moreDrugs}>+{scenario.drugState.drugs.length - 5} more</span>
                  )}
                  {scenario.drugState.drugs.length === 0 && (
                    <span className={styles.noDevices}>No medications</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className={styles.actionRow}>
              {/* Labs popup trigger */}
              <button
                className={styles.actionBtn}
                onClick={() => {
                  if (!labsOpen) {
                    const first = LAB_PANEL_LABELS.find(
                      ({ key }) => (scenario.labs[key as keyof typeof scenario.labs] as LabParameter[]).length > 0
                    );
                    setLabActivePanel(first ? first.key : 'hematology');
                  }
                  setLabsOpen((v) => !v);
                }}
              >
                <FlaskConical size={15} />
                View Labs
                {Object.values(scenario.labs).flat().filter(p => p.flag !== 'normal').length > 0 && (
                  <Badge variant="warning">
                    {Object.values(scenario.labs).flat().filter(p => p.flag !== 'normal').length} flagged
                  </Badge>
                )}
              </button>

              {/* Imaging */}
              {scenario.media.length > 0 && (
                <button
                  className={styles.actionBtn}
                  onClick={() => setImagingOpen(!imagingOpen)}
                >
                  <Image size={15} />
                  View Imaging ({scenario.media.length})
                </button>
              )}
            </div>



            {/* Imaging Popup */}
            {imagingOpen && (
              <div className={styles.popup}>
                <div className={styles.popupHeader}>
                  <span>Imaging</span>
                  <button className={styles.popupClose} onClick={() => setImagingOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
                <div className={styles.imagingGrid}>
                  {scenario.media.map((m) => (
                    <div key={m.id} className={styles.imagingThumb}
                      onClick={() => setSelectedImage(m.url)}>
                      {m.mimeType.startsWith('image/') ? (
                        <img src={m.url} alt={m.label} className={styles.imagingImg} />
                      ) : (
                        <div className={styles.videoPlaceholder}>{m.label}</div>
                      )}
                      <span className={styles.imagingLabel}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full-size image lightbox */}
            {selectedImage && (
              <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
                <img src={selectedImage} alt="Preview" className={styles.lightboxImg} />
              </div>
            )}
          </div>
          {/* ── Labs Overlay ───────────────────────────────────────────── */}
          {labsOpen && (
            <div className={styles.labsOverlay} onClick={() => setLabsOpen(false)}>
              <div className={styles.labsOverlayPanel} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.labsOverlayHeader}>
                  <FlaskConical size={14} />
                  <span>Lab Results</span>
                  <span className={styles.labsOverlayPatient}>
                    {scenario.demographics.name || 'Patient'}
                    {scenario.demographics.uhid ? ` · ${scenario.demographics.uhid}` : ''}
                  </span>
                  <button className={styles.popupClose} onClick={() => setLabsOpen(false)}>
                    <X size={15} />
                  </button>
                </div>

                {/* Body: sidebar + content */}
                <div className={styles.labsOverlayBody}>

                  {/* Sidebar tabs */}
                  <div className={styles.labsSidebar}>
                    {LAB_PANEL_LABELS.map(({ key, label }) => {
                      const params = scenario.labs[key as keyof typeof scenario.labs] as LabParameter[];
                      const flagged = params.filter((p) => p.flag !== 'normal').length;
                      return (
                        <button
                          key={key}
                          className={`${styles.labsSidebarBtn} ${labActivePanel === key ? styles.labsSidebarBtnActive : ''}`}
                          onClick={() => setLabActivePanel(key)}
                        >
                          <span className={styles.labsSidebarLabel}>{label}</span>
                          <span className={styles.labsCount}>{params.length}</span>
                          {flagged > 0 && <span className={styles.labsFlagCount}>{flagged}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Table content */}
                  <div className={styles.labsTableWrap}>
                    {(() => {
                      const params = (scenario.labs[labActivePanel as keyof typeof scenario.labs] as LabParameter[]) ?? [];
                      if (params.length === 0) {
                        return <div className={styles.labsEmpty}>No labs recorded for this panel.</div>;
                      }
                      return (
                        <table className={styles.labsTable}>
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Result</th>
                              <th>Reference Range</th>
                              <th>Flag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {params.map((p) => (
                              <tr
                                key={p.id}
                                className={
                                  p.isCritical
                                    ? styles.labsRowCrit
                                    : p.flag !== 'normal'
                                    ? styles.labsRowFlag
                                    : styles.labsRowNormal
                                }
                              >
                                <td className={styles.labsParamCell}>{p.parameter}</td>
                                <td className={styles.labsResultCell}>
                                  <span className={p.isCritical ? styles.labsValCrit : p.flag !== 'normal' ? styles.labsValFlag : styles.labsValNormal}>
                                    {p.result}
                                  </span>
                                  {p.unit && <span className={styles.labsUnit}>&nbsp;{p.unit}</span>}
                                </td>
                                <td className={styles.labsRefCell}>
                                  {p.refRangeLow !== '' && p.refRangeHigh !== ''
                                    ? `${p.refRangeLow} – ${p.refRangeHigh}`
                                    : '—'}
                                </td>
                                <td className={styles.labsFlagCell}>
                                  {p.flag !== 'normal' && (
                                    <span className={`${styles.flagChip} ${flagChipClass(p.flag, styles)}`}>
                                      {flagLabel(p.flag)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
