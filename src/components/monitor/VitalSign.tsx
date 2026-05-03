import React from 'react';
import styles from './VitalSign.module.css';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalSignProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  color?: string;
  alarm?: 'high' | 'low' | 'critical' | null;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
}

const alarmColorMap = {
  high: '#FF9800',
  low: '#FF9800',
  critical: '#FF1744',
};

export const VitalSign: React.FC<VitalSignProps> = ({
  label,
  value,
  unit,
  subValue,
  color = '#00E676',
  alarm,
  trend,
  size = 'md',
}) => {
  const displayColor = alarm ? alarmColorMap[alarm] : color;
  const isAlarming = alarm === 'critical';

  return (
    <div className={`${styles.vital} ${styles[size]} ${isAlarming ? styles.alarming : ''}`}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {alarm && (
          <AlertTriangle
            size={12}
            color={displayColor}
            className={isAlarming ? styles.pulseIcon : ''}
          />
        )}
        {trend && !alarm && (
          <span className={styles.trend}>
            {trend === 'up' && <TrendingUp size={10} color="#FF9800" />}
            {trend === 'down' && <TrendingDown size={10} color="#FF9800" />}
            {trend === 'stable' && <Minus size={10} color="#64748B" />}
          </span>
        )}
      </div>
      <div className={styles.valueRow} style={{ color: displayColor }}>
        <span className={styles.value}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {subValue && <div className={styles.subValue} style={{ color: displayColor }}>{subValue}</div>}
    </div>
  );
};
