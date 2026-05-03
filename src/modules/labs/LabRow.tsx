import React from 'react';
import styles from './LabRow.module.css';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { LabPanelKey, LabParameter, LabFlag } from '../../types';
import { Trash2, AlertCircle } from 'lucide-react';

interface LabRowProps {
  panel: LabPanelKey;
  param: LabParameter;
}

function flagToBadgeVariant(flag: LabFlag): 'danger' | 'warning' | 'success' | 'critical' | 'muted' {
  switch (flag) {
    case 'critical-high':
    case 'critical-low':
      return 'critical';
    case 'high':
    case 'low':
      return 'warning';
    case 'normal':
      return 'success';
    default:
      return 'muted';
  }
}

function flagToLabel(flag: LabFlag): string {
  switch (flag) {
    case 'critical-high': return 'CRIT H';
    case 'critical-low': return 'CRIT L';
    case 'high': return 'HIGH';
    case 'low': return 'LOW';
    case 'normal': return 'NL';
    default: return '—';
  }
}

export const LabRow: React.FC<LabRowProps> = ({ panel, param }) => {
  const updateLabParameter = useScenarioStore((s) => s.updateLabParameter);
  const removeLabParameter = useScenarioStore((s) => s.removeLabParameter);

  const handleChange = (field: keyof LabParameter, value: string | number) => {
    const updated: LabParameter = { ...param, [field]: value };

    // Auto-compute flag when result or range changes
    if (field === 'result' || field === 'refRangeLow' || field === 'refRangeHigh') {
      updated.flag = computeFlag(
        String(field === 'result' ? value : updated.result),
        Number(field === 'refRangeLow' ? value : updated.refRangeLow) || 0,
        Number(field === 'refRangeHigh' ? value : updated.refRangeHigh) || 0
      );
      updated.isCritical = updated.flag === 'critical-high' || updated.flag === 'critical-low';
    }

    updateLabParameter(panel, updated);
  };

  const isCritical = param.flag === 'critical-high' || param.flag === 'critical-low';

  return (
    <tr className={`${styles.row} ${isCritical ? styles.criticalRow : ''}`}>
      <td>
        <input
          className={styles.cellInput}
          value={param.parameter}
          onChange={(e) => handleChange('parameter', e.target.value)}
          placeholder="e.g., Hemoglobin"
        />
      </td>
      <td>
        <input
          className={`${styles.cellInput} ${styles.resultInput} ${
            param.flag !== 'normal' ? styles[`flag_${param.flag.replace('-', '_')}`] : ''
          }`}
          value={param.result}
          onChange={(e) => handleChange('result', e.target.value)}
          placeholder="Value"
        />
      </td>
      <td>
        <input
          className={`${styles.cellInput} ${styles.unitInput}`}
          value={param.unit}
          onChange={(e) => handleChange('unit', e.target.value)}
          placeholder="Unit"
        />
      </td>
      <td>
        <input
          className={`${styles.cellInput} ${styles.rangeInput}`}
          type="number"
          value={param.refRangeLow}
          onChange={(e) => handleChange('refRangeLow', parseFloat(e.target.value) || '')}
          placeholder="Low"
        />
      </td>
      <td>
        <input
          className={`${styles.cellInput} ${styles.rangeInput}`}
          type="number"
          value={param.refRangeHigh}
          onChange={(e) => handleChange('refRangeHigh', parseFloat(e.target.value) || '')}
          placeholder="High"
        />
      </td>
      <td>
        <div className={styles.flagCell}>
          <Badge variant={flagToBadgeVariant(param.flag)}>
            {flagToLabel(param.flag)}
          </Badge>
          {isCritical && <AlertCircle size={12} className={styles.criticalIcon} />}
        </div>
      </td>
      <td>
        <button
          className={styles.deleteBtn}
          onClick={() => removeLabParameter(panel, param.id)}
          aria-label="Remove parameter"
          title="Remove"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
};

function computeFlag(result: string, low: number, high: number): LabFlag {
  const val = parseFloat(result);
  if (isNaN(val)) return 'normal';
  if (high > 0 && val > high * 1.5) return 'critical-high';
  if (high > 0 && val > high) return 'high';
  if (low > 0 && val < low * 0.5) return 'critical-low';
  if (low > 0 && val < low) return 'low';
  return 'normal';
}
