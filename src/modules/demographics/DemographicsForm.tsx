import React from 'react';
import styles from './DemographicsForm.module.css';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useScenarioStore } from '../../store/scenarioStore';
import { User, Hash, Calendar, ClipboardList, Activity, Weight, Ruler } from 'lucide-react';

export const DemographicsForm: React.FC = () => {
  const demographics = useScenarioStore((s) => s.activeScenario.demographics);
  const updateDemographics = useScenarioStore((s) => s.updateDemographics);

  const onChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    updateDemographics({ [field]: value });
  };

  return (
    <div className={styles.root}>
      <div className={styles.sectionHeader}>
        <User size={16} className={styles.sectionIcon} />
        <span>Patient Identification</span>
      </div>

      <div className={styles.grid2}>
        <Input
          label="Full Name"
          placeholder="Patient Full Name"
          value={demographics.name}
          onChange={onChange('name')}
          icon={<User size={14} />}
        />
        <Input
          label="UHID / MRN"
          placeholder="Unique Hospital ID"
          value={demographics.uhid}
          onChange={onChange('uhid')}
          icon={<Hash size={14} />}
        />
      </div>

      <div className={styles.grid3}>
        <Input
          label="Age"
          type="number"
          placeholder="Years"
          value={demographics.age || ''}
          onChange={onChange('age')}
          unit="yrs"
          min={0}
          max={120}
        />
        <Select
          label="Sex"
          value={demographics.sex}
          onValueChange={(v) => updateDemographics({ sex: v as 'male' | 'female' | 'other' })}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <Input
          label="Admission Date/Time"
          type="datetime-local"
          value={demographics.admissionDateTime}
          onChange={onChange('admissionDateTime')}
          icon={<Calendar size={14} />}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <Ruler size={16} className={styles.sectionIcon} />
        <span>Anthropometrics</span>
      </div>

      <div className={styles.grid4}>
        <Input
          label="Height"
          type="number"
          placeholder="cm"
          value={demographics.height || ''}
          onChange={onChange('height')}
          unit="cm"
          min={50}
          max={250}
          icon={<Ruler size={14} />}
        />
        <Input
          label="Weight"
          type="number"
          placeholder="kg"
          value={demographics.weight || ''}
          onChange={onChange('weight')}
          unit="kg"
          min={1}
          max={300}
          icon={<Weight size={14} />}
        />

        {/* Auto-calculated fields */}
        <div className={styles.calculatedField}>
          <label className={styles.calcLabel}>BMI</label>
          <div className={styles.calcValue}>
            <span className={styles.calcNumber}>{demographics.bmi || '—'}</span>
            <span className={styles.calcUnit}>kg/m²</span>
          </div>
          <span className={styles.calcHint}>{getBMICategory(demographics.bmi)}</span>
        </div>
        <div className={styles.calculatedField}>
          <label className={styles.calcLabel}>BSA (Mosteller)</label>
          <div className={styles.calcValue}>
            <span className={styles.calcNumber}>{demographics.bsa || '—'}</span>
            <span className={styles.calcUnit}>m²</span>
          </div>
          <span className={styles.calcHint}>Auto-calculated</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <ClipboardList size={16} className={styles.sectionIcon} />
        <span>Clinical Information</span>
      </div>

      <div className={styles.grid1}>
        <Input
          label="Primary Diagnosis"
          placeholder="e.g., Acute ARDS with refractory hypoxemia"
          value={demographics.diagnosis}
          onChange={onChange('diagnosis')}
          icon={<Activity size={14} />}
        />
      </div>

      <div className={styles.grid1}>
        <div className={styles.textareaContainer}>
          <label className={styles.textareaLabel}>Clinical History</label>
          <textarea
            className={styles.textarea}
            placeholder="Brief clinical history, relevant comorbidities, events leading to ICU admission..."
            value={demographics.clinicalHistory}
            onChange={onChange('clinicalHistory')}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

function getBMICategory(bmi: number): string {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
