import React, { useState } from 'react';
import styles from './LabsModule.module.css';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { LabRow } from './LabRow';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { LabPanelKey, LabParameter } from '../../types';
import { Plus, FlaskConical, Activity, Droplets, Zap, Heart, Bug, Settings2 } from 'lucide-react';

const PANEL_TABS: { key: LabPanelKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hematology', label: 'Hematology', icon: <Droplets size={13} /> },
  { key: 'biochemistry', label: 'Biochemistry', icon: <FlaskConical size={13} /> },
  { key: 'abg', label: 'ABG', icon: <Activity size={13} /> },
  { key: 'coagulation', label: 'Coagulation', icon: <Zap size={13} /> },
  { key: 'cardiacMarkers', label: 'Cardiac Markers', icon: <Heart size={13} /> },
  { key: 'infection', label: 'Infection', icon: <Bug size={13} /> },
  { key: 'icuEcmo', label: 'ICU/ECMO', icon: <Settings2 size={13} /> },
];

export const LabsModule: React.FC = () => {
  const labs = useScenarioStore((s) => s.activeScenario.labs);
  const addLabParameter = useScenarioStore((s) => s.addLabParameter);
  const [activePanel, setActivePanel] = useState<LabPanelKey>('hematology');

  const getFlagCount = (key: LabPanelKey) => {
    return labs[key].filter((p) => p.flag !== 'normal').length;
  };

  const getCriticalCount = (key: LabPanelKey) => {
    return labs[key].filter((p) => p.flag === 'critical-high' || p.flag === 'critical-low').length;
  };

  const handleAddRow = () => {
    const newParam: LabParameter = {
      id: crypto.randomUUID(),
      parameter: '',
      result: '',
      unit: '',
      refRangeLow: '',
      refRangeHigh: '',
      flag: 'normal',
      isCritical: false,
    };
    addLabParameter(activePanel, newParam);
  };

  return (
    <div className={styles.root}>
      <TabsPrimitive.Root
        value={activePanel}
        onValueChange={(v) => setActivePanel(v as LabPanelKey)}
      >
        <TabsPrimitive.List className={styles.tabList} aria-label="Lab panels">
          {PANEL_TABS.map((tab) => {
            const flagCount = getFlagCount(tab.key);
            const critCount = getCriticalCount(tab.key);
            return (
              <TabsPrimitive.Trigger key={tab.key} value={tab.key} className={styles.tab}>
                <span className={styles.tabInner}>
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                  {critCount > 0 && (
                    <Badge variant="critical" size="sm">{critCount}</Badge>
                  )}
                  {flagCount > 0 && critCount === 0 && (
                    <Badge variant="warning" size="sm">{flagCount}</Badge>
                  )}
                </span>
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        {PANEL_TABS.map((tab) => (
          <TabsPrimitive.Content key={tab.key} value={tab.key} className={styles.tabContent}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Units</th>
                    <th>Ref Low</th>
                    <th>Ref High</th>
                    <th>Flag</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {labs[tab.key].map((param) => (
                    <LabRow key={param.id} panel={tab.key} param={param} />
                  ))}
                  {labs[tab.key].length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.emptyRow}>
                        No parameters. Click "Add Row" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={13} />}
                onClick={handleAddRow}
              >
                Add Row
              </Button>
              <span className={styles.summary}>
                {labs[tab.key].length} parameter{labs[tab.key].length !== 1 ? 's' : ''}
                {getFlagCount(tab.key) > 0 && (
                  <> · <span className={styles.flagWarning}>{getFlagCount(tab.key)} flagged</span></>
                )}
              </span>
            </div>
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>
    </div>
  );
};
