import React, { useState } from 'react';
import styles from './ScenarioBuilder.module.css';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { DemographicsForm } from '../modules/demographics/DemographicsForm';
import { LabsModule } from '../modules/labs/LabsModule';
import { VitalsModule } from '../modules/vitals/VitalsModule';
import { DevicesModule } from '../modules/devices/DevicesModule';
import { DrugsModule } from '../modules/drugs/DrugsModule';
import { MediaModule } from '../modules/media/MediaModule';
import { PreviewModal } from '../modules/preview/PreviewModal';
import { useScenarioStore } from '../store/scenarioStore';
import {
  User, FlaskConical, Activity, Settings2, Pill, Image,
  ChevronLeft, ChevronRight, Eye, Save, Plus, RefreshCw,
  Copy, Trash2, CheckCircle, AlertCircle, Layers
} from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  description: string;
}

export const ScenarioBuilder: React.FC = () => {
  const {
    activeScenario, savedScenarios, currentStep, previewOpen, isDirty,
    setStep, setPreviewOpen, saveScenario, newScenario, loadScenario,
    duplicateScenario, deleteScenario, updateScenarioMeta,
  } = useScenarioStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedNotif, setSavedNotif] = useState(false);

  const steps: Step[] = [
    {
      id: 'demographics', label: 'Demographics', icon: <User size={15} />,
      component: <DemographicsForm />,
      description: 'Patient identification, anthropometrics, and clinical history',
    },
    {
      id: 'labs', label: 'Lab Results', icon: <FlaskConical size={15} />,
      component: <LabsModule />,
      description: 'Hematology, ABG, biochemistry, coagulation, cardiac markers',
    },
    {
      id: 'vitals', label: 'Vitals & Waveforms', icon: <Activity size={15} />,
      component: <VitalsModule />,
      description: 'Hemodynamics, respiratory parameters, ECG and waveform config',
    },
    {
      id: 'devices', label: 'Devices', icon: <Settings2 size={15} />,
      component: <DevicesModule />,
      description: 'ECMO, ventilator, IABP, defibrillator configuration',
    },
    {
      id: 'drugs', label: 'Medications', icon: <Pill size={15} />,
      component: <DrugsModule />,
      description: 'Vasopressors, sedatives, antibiotics, IV fluids, blood products',
    },
    {
      id: 'media', label: 'Imaging', icon: <Image size={15} />,
      component: <MediaModule />,
      description: 'X-rays, echo clips, CT scans, ultrasound studies',
    },
  ];

  const handleSave = () => {
    saveScenario();
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 3000);
  };

  const handleRunAndPreview = () => {
    // Just open — do NOT auto-run simulation; preview shows authored values by default.
    // The user can explicitly click "Re-simulate" in the modal to apply device/drug effects.
    setPreviewOpen(true);
  };

  const activeStep = steps[currentStep];

  return (
    <div className={styles.root}>
      {/* ── Top App Bar ── */}
      <header className={styles.appBar}>
        <div className={styles.appBarLeft}>
          <div className={styles.appLogo}>
            <RefreshCw size={18} className={styles.logoIcon} />
            <span className={styles.logoText}>ECMO</span>
            <span className={styles.logoSub}>Scenario Builder</span>
          </div>
          <div className={styles.scenarioMeta}>
            <Input
              value={activeScenario.name}
              onChange={(e) => updateScenarioMeta({ name: e.target.value })}
              placeholder="Scenario name..."
              containerClassName={styles.scenarioNameInput}
            />
            <Select
              value={activeScenario.difficulty}
              onValueChange={(v) => updateScenarioMeta({ difficulty: v as typeof activeScenario.difficulty })}
              options={[
                { value: 'basic', label: 'Basic' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
                { value: 'expert', label: 'Expert' },
              ]}
            />
            {isDirty && <Badge variant="warning" dot>Unsaved</Badge>}
            {savedNotif && (
              <div className={styles.savedNotif}>
                <CheckCircle size={13} />
                Saved
              </div>
            )}
          </div>
        </div>

        <div className={styles.appBarRight}>
          <Button variant="ghost" size="sm" icon={<Layers size={14} />}
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            Scenarios
          </Button>
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={newScenario}>
            New
          </Button>
          <Button variant="secondary" size="sm" icon={<Save size={14} />} onClick={handleSave}>
            Save
          </Button>
          <Button variant="primary" size="sm" icon={<Eye size={14} />} onClick={handleRunAndPreview}>
            Preview
          </Button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── Sidebar: Scenario List ── */}
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>Saved Scenarios</span>
              <Badge variant="info">{savedScenarios.length}</Badge>
            </div>
            <div className={styles.scenarioList}>
              {savedScenarios.length === 0 && (
                <div className={styles.emptySidebar}>
                  <AlertCircle size={20} className={styles.emptyIcon} />
                  <span>No saved scenarios</span>
                </div>
              )}
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className={`${styles.scenarioItem} ${sc.id === activeScenario.id ? styles.activeItem : ''}`}
                  onClick={() => loadScenario(sc.id)}
                >
                  <div className={styles.scName}>{sc.name}</div>
                  <div className={styles.scMeta}>
                    <Badge variant={sc.difficulty === 'expert' ? 'danger' : sc.difficulty === 'advanced' ? 'warning' : 'info'} size="sm">
                      {sc.difficulty}
                    </Badge>
                    <span className={styles.scDate}>
                      {new Date(sc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.scActions}>
                    <button className={styles.scBtn} onClick={(e) => { e.stopPropagation(); duplicateScenario(sc.id); }} title="Duplicate">
                      <Copy size={12} />
                    </button>
                    <button className={styles.scBtn} onClick={(e) => { e.stopPropagation(); deleteScenario(sc.id); }} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main className={styles.main}>
          {/* Step Navigation */}
          <nav className={styles.stepNav}>
            {steps.map((step, idx) => (
              <button
                key={step.id}
                className={`${styles.stepBtn} ${idx === currentStep ? styles.stepActive : ''} ${idx < currentStep ? styles.stepDone : ''}`}
                onClick={() => setStep(idx)}
              >
                <span className={styles.stepIconWrap}>{step.icon}</span>
                <span className={styles.stepLabel}>{step.label}</span>
                {idx < currentStep && <CheckCircle size={11} className={styles.doneCheck} />}
              </button>
            ))}
          </nav>

          {/* Step Content */}
          <div className={styles.stepContent}>
            <div className={styles.stepContentHeader}>
              <div className={styles.stepHeaderLeft}>
                <div className={styles.stepHeaderIcon}>{activeStep.icon}</div>
                <div>
                  <h2 className={styles.stepTitle}>{activeStep.label}</h2>
                  <p className={styles.stepDesc}>{activeStep.description}</p>
                </div>
              </div>
              <div className={styles.stepNav2}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronLeft size={14} />}
                  disabled={currentStep === 0}
                  onClick={() => setStep(currentStep - 1)}
                >
                  Previous
                </Button>
                <span className={styles.stepCounter}>{currentStep + 1} / {steps.length}</span>
                <Button
                  variant={currentStep === steps.length - 1 ? 'primary' : 'secondary'}
                  size="sm"
                  iconRight={currentStep === steps.length - 1 ? <Eye size={14} /> : <ChevronRight size={14} />}
                  onClick={() => {
                    if (currentStep === steps.length - 1) handleRunAndPreview();
                    else setStep(currentStep + 1);
                  }}
                >
                  {currentStep === steps.length - 1 ? 'Preview' : 'Next'}
                </Button>
              </div>
            </div>

            <div className={styles.moduleContainer}>
              {activeStep.component}
            </div>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
};
