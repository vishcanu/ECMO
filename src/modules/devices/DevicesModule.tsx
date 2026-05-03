import React, { useState } from 'react';
import styles from './DevicesModule.module.css';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ECMOPanel } from './ECMOPanel';
import { VentilatorPanel } from './VentilatorPanel';
import { IABPPanel } from './IABPPanel';
import { DefibrillatorPanel } from './DefibrillatorPanel';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import { Wind, Zap, Activity, RefreshCw } from 'lucide-react';

export const DevicesModule: React.FC = () => {
  const [activeDevice, setActiveDevice] = useState('ecmo');
  const devices = useScenarioStore((s) => s.activeScenario.devices);

  return (
    <div className={styles.root}>
      <TabsPrimitive.Root value={activeDevice} onValueChange={setActiveDevice}>
        <TabsPrimitive.List className={styles.tabList}>
          <TabsPrimitive.Trigger value="ecmo" className={styles.tab}>
            <span className={styles.tabInner}>
              <RefreshCw size={13} />
              <span>ECMO</span>
              {devices.ecmo.enabled && <Badge variant="success" dot>Active</Badge>}
            </span>
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="ventilator" className={styles.tab}>
            <span className={styles.tabInner}>
              <Wind size={13} />
              <span>Ventilator</span>
              {devices.ventilator.enabled && <Badge variant="success" dot>Active</Badge>}
            </span>
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="iabp" className={styles.tab}>
            <span className={styles.tabInner}>
              <Activity size={13} />
              <span>IABP</span>
              {devices.iabp.enabled && <Badge variant="success" dot>Active</Badge>}
            </span>
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="defibrillator" className={styles.tab}>
            <span className={styles.tabInner}>
              <Zap size={13} />
              <span>Defibrillator</span>
            </span>
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="ecmo" className={styles.content}>
          <ECMOPanel />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="ventilator" className={styles.content}>
          <VentilatorPanel />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="iabp" className={styles.content}>
          <IABPPanel />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="defibrillator" className={styles.content}>
          <DefibrillatorPanel />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
};
