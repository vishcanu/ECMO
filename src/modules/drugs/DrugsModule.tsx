import React, { useState } from 'react';
import styles from './DrugsModule.module.css';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import { useDifficultyGates } from '../../hooks/useDifficultyGates';
import type { Drug, BloodProduct, DrugCategory, FluidType, BloodProductType } from '../../types';
import { Plus, Trash2, Pill, Droplets, HeartPulse, Calculator, Lock } from 'lucide-react';

const DRUG_CATEGORIES: { value: DrugCategory; label: string }[] = [
  { value: 'vasopressor', label: 'Vasopressor' },
  { value: 'inotrope', label: 'Inotrope' },
  { value: 'sedative', label: 'Sedative' },
  { value: 'analgesic', label: 'Analgesic/Opioid' },
  { value: 'antibiotic', label: 'Antibiotic' },
  { value: 'anticoagulant', label: 'Anticoagulant' },
  { value: 'antiarrhythmic', label: 'Antiarrhythmic' },
  { value: 'diuretic', label: 'Diuretic' },
  { value: 'other', label: 'Other' },
];

const COMMON_DRUGS: Record<DrugCategory, string[]> = {
  vasopressor: ['Norepinephrine', 'Vasopressin', 'Phenylephrine', 'Epinephrine'],
  inotrope: ['Dobutamine', 'Dopamine', 'Milrinone', 'Levosimendan'],
  sedative: ['Propofol', 'Midazolam', 'Dexmedetomidine', 'Ketamine'],
  analgesic: ['Fentanyl', 'Morphine', 'Hydromorphone', 'Remifentanil'],
  antibiotic: ['Piperacillin-Tazobactam', 'Meropenem', 'Vancomycin', 'Cefepime'],
  anticoagulant: ['Heparin', 'Enoxaparin', 'Bivalirudin', 'Argatroban'],
  antiarrhythmic: ['Amiodarone', 'Lidocaine', 'Esmolol', 'Adenosine'],
  diuretic: ['Furosemide', 'Torsemide', 'Bumetanide'],
  other: ['Insulin', 'Hydrocortisone', 'Vitamin C', 'Thiamine'],
};

const FLUID_TYPES: FluidType[] = [
  'Normal Saline', 'Lactated Ringer', 'D5W', 'D5NS',
  'Albumin 5%', 'Albumin 25%', 'HES 6%', 'Other'
];

const BLOOD_PRODUCT_TYPES: BloodProductType[] = [
  'PRBC', 'FFP', 'Platelets', 'Cryoprecipitate', 'Whole Blood'
];

export const DrugsModule: React.FC = () => {
  const drugState = useScenarioStore((s) => s.activeScenario.drugState);
  const weight = useScenarioStore((s) => s.activeScenario.demographics.weight);
  const { addDrug, updateDrug, removeDrug, addFluid, updateFluid, removeFluid,
    addBloodProduct, updateBloodProduct, removeBloodProduct } = useScenarioStore();
  const [drugTab, setDrugTab] = useState('drugs');
  const { showDrugs, difficulty } = useDifficultyGates();

  const handleAddDrug = () => {
    const drug: Drug = {
      id: crypto.randomUUID(),
      name: '',
      genericName: '',
      category: 'vasopressor',
      dose: 0,
      unit: 'mcg/kg/min',
      route: 'IV',
      frequency: 'Continuous',
      weightBased: true,
      calculatedDose: 0,
      infusionRate: 0,
      concentration: '',
      notes: '',
    };
    addDrug(drug);
  };

  const handleAddFluid = () => {
    addFluid({ id: crypto.randomUUID(), type: 'Normal Saline', volume: 500, rate: 125, duration: 4 });
  };

  const handleAddBlood = () => {
    addBloodProduct({ id: crypto.randomUUID(), type: 'PRBC', units: 2, volume: 400, crossmatch: true, irradiated: false, leucodepleted: true });
  };

  return (
    <>
    {!showDrugs && (
      <div className={styles.lockedOverlay}>
        <div className={styles.lockedCard}>
          <Lock size={32} className={styles.lockedIcon} />
          <h3 className={styles.lockedTitle}>Medications Locked</h3>
          <p className={styles.lockedDesc}>
            The drug infusion panel is not available at <strong>{difficulty}</strong> level.
          </p>
          <p className={styles.lockedUpgrade}>
            Set difficulty to <strong>Intermediate</strong>, <strong>Advanced</strong>, or <strong>Expert</strong> to configure medications, IV fluids, and blood products.
          </p>
        </div>
      </div>
    )}
    <div style={!showDrugs ? { opacity: 0.25, pointerEvents: 'none', userSelect: 'none' } : undefined} className={styles.root}>
      <TabsPrimitive.Root value={drugTab} onValueChange={setDrugTab}>
        <TabsPrimitive.List className={styles.tabList}>
          <TabsPrimitive.Trigger value="drugs" className={styles.tab}>
            <Pill size={13} />
            Medications
            {drugState.drugs.length > 0 && <Badge variant="info">{drugState.drugs.length}</Badge>}
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="fluids" className={styles.tab}>
            <Droplets size={13} />
            IV Fluids
            {drugState.fluids.length > 0 && <Badge variant="info">{drugState.fluids.length}</Badge>}
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="blood" className={styles.tab}>
            <HeartPulse size={13} />
            Blood Products
            {drugState.bloodProducts.length > 0 && <Badge variant="danger">{drugState.bloodProducts.length}</Badge>}
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        {/* ── Medications ── */}
        <TabsPrimitive.Content value="drugs" className={styles.content}>
          <div className={styles.addRow}>
            <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={handleAddDrug}>
              Add Medication
            </Button>
          </div>
          <div className={styles.drugList}>
            {drugState.drugs.map((drug) => (
              <div key={drug.id} className={styles.drugCard}>
                <div className={styles.drugCardHeader}>
                  <Badge variant={getCategoryBadge(drug.category)}>{drug.category}</Badge>
                  <button className={styles.deleteBtn} onClick={() => removeDrug(drug.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className={styles.drugGrid}>
                  <div className={styles.drugNameCol}>
                    <Select
                      label="Drug Name"
                      value={drug.name}
                      onValueChange={(v) => updateDrug(drug.id, { name: v })}
                      options={[
                        ...((COMMON_DRUGS[drug.category] ?? []).map((n) => ({ value: n, label: n }))),
                        { value: drug.name || 'custom', label: drug.name || 'Custom...' },
                      ]}
                    />
                  </div>
                  <Select
                    label="Category"
                    value={drug.category}
                    onValueChange={(v) => updateDrug(drug.id, { category: v as DrugCategory })}
                    options={DRUG_CATEGORIES}
                  />
                  <Input
                    label="Dose"
                    type="number"
                    value={drug.dose || ''}
                    onChange={(e) => {
                      const d = parseFloat(e.target.value) || 0;
                      const calc = drug.weightBased ? d * weight : d;
                      updateDrug(drug.id, { dose: d, calculatedDose: calc });
                    }}
                    unit={drug.unit}
                  />
                  <Input
                    label="Unit"
                    value={drug.unit}
                    onChange={(e) => updateDrug(drug.id, { unit: e.target.value })}
                    placeholder="mcg/kg/min"
                  />
                  <Select
                    label="Route"
                    value={drug.route}
                    onValueChange={(v) => updateDrug(drug.id, { route: v as Drug['route'] })}
                    options={[
                      { value: 'IV', label: 'IV' },
                      { value: 'IM', label: 'IM' },
                      { value: 'PO', label: 'PO' },
                      { value: 'SC', label: 'SC' },
                      { value: 'SL', label: 'SL' },
                    ]}
                  />
                  <Input
                    label="Infusion Rate"
                    type="number"
                    value={drug.infusionRate || ''}
                    onChange={(e) => updateDrug(drug.id, { infusionRate: parseFloat(e.target.value) || 0 })}
                    unit="mL/hr"
                  />
                </div>
                {drug.weightBased && weight > 0 && drug.dose > 0 && (
                  <div className={styles.calcDose}>
                    <Calculator size={11} />
                    <span>
                      Calculated dose: <strong>{(drug.dose * weight).toFixed(2)} {drug.unit.replace('/kg', '')}</strong>
                      {' '}for {weight} kg patient
                    </span>
                  </div>
                )}
                <Input
                  label="Notes / Concentration"
                  value={drug.notes}
                  onChange={(e) => updateDrug(drug.id, { notes: e.target.value })}
                  placeholder="e.g., 4 mg in 50 mL NS → 80 mcg/mL"
                />
              </div>
            ))}
            {drugState.drugs.length === 0 && (
              <div className={styles.empty}>No medications added. Click "Add Medication" to begin.</div>
            )}
          </div>
        </TabsPrimitive.Content>

        {/* ── IV Fluids ── */}
        <TabsPrimitive.Content value="fluids" className={styles.content}>
          <div className={styles.addRow}>
            <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={handleAddFluid}>
              Add IV Fluid
            </Button>
          </div>
          <div className={styles.fluidTable}>
            {drugState.fluids.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fluid Type</th>
                    <th>Volume (mL)</th>
                    <th>Rate (mL/hr)</th>
                    <th>Duration (hr)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {drugState.fluids.map((fluid) => (
                    <tr key={fluid.id} className={styles.tableRow}>
                      <td>
                        <Select
                          value={fluid.type}
                          onValueChange={(v) => updateFluid(fluid.id, { type: v as FluidType })}
                          options={FLUID_TYPES.map((t) => ({ value: t, label: t }))}
                        />
                      </td>
                      <td><input className={styles.tableInput} type="number" value={fluid.volume}
                        onChange={(e) => updateFluid(fluid.id, { volume: parseFloat(e.target.value) || 0 })} /></td>
                      <td><input className={styles.tableInput} type="number" value={fluid.rate}
                        onChange={(e) => updateFluid(fluid.id, { rate: parseFloat(e.target.value) || 0 })} /></td>
                      <td><input className={styles.tableInput} type="number" value={fluid.duration}
                        onChange={(e) => updateFluid(fluid.id, { duration: parseFloat(e.target.value) || 0 })} /></td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => removeFluid(fluid.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {drugState.fluids.length === 0 && <div className={styles.empty}>No IV fluids added.</div>}
          </div>
        </TabsPrimitive.Content>

        {/* ── Blood Products ── */}
        <TabsPrimitive.Content value="blood" className={styles.content}>
          <div className={styles.addRow}>
            <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={handleAddBlood}>
              Add Blood Product
            </Button>
          </div>
          <div className={styles.bloodList}>
            {drugState.bloodProducts.map((bp) => (
              <div key={bp.id} className={styles.bloodCard}>
                <div className={styles.bloodCardHeader}>
                  <Badge variant="danger">{bp.type}</Badge>
                  <button className={styles.deleteBtn} onClick={() => removeBloodProduct(bp.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className={styles.bloodGrid}>
                  <Select
                    label="Product Type"
                    value={bp.type}
                    onValueChange={(v) => updateBloodProduct(bp.id, { type: v as BloodProductType })}
                    options={BLOOD_PRODUCT_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                  <Input label="Units" type="number" value={bp.units}
                    onChange={(e) => updateBloodProduct(bp.id, { units: parseFloat(e.target.value) || 0 })}
                    unit="units" />
                  <Input label="Volume" type="number" value={bp.volume}
                    onChange={(e) => updateBloodProduct(bp.id, { volume: parseFloat(e.target.value) || 0 })}
                    unit="mL" />
                </div>
                <div className={styles.bloodCheckboxes}>
                  {['crossmatch', 'irradiated', 'leucodepleted'].map((field) => (
                    <label key={field} className={styles.checkboxLabel}>
                      <input type="checkbox" className={styles.checkbox}
                        checked={bp[field as keyof BloodProduct] as boolean}
                        onChange={(e) => updateBloodProduct(bp.id, { [field]: e.target.checked })} />
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {drugState.bloodProducts.length === 0 && <div className={styles.empty}>No blood products added.</div>}
          </div>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
    </>
  );
};

function getCategoryBadge(cat: DrugCategory): 'danger' | 'warning' | 'info' | 'success' | 'default' {
  const map: Record<DrugCategory, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
    vasopressor: 'danger', inotrope: 'warning', sedative: 'info',
    analgesic: 'info', antibiotic: 'success', anticoagulant: 'warning',
    antiarrhythmic: 'danger', diuretic: 'default', other: 'default',
  };
  return map[cat];
}
