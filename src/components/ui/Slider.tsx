import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as Label from '@radix-ui/react-label';
import styles from './Slider.module.css';

interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  disabled?: boolean;
  onValueChange: (value: number) => void;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  id?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  hint,
  disabled,
  onValueChange,
  showValue = true,
  formatValue,
  id,
}) => {
  const inputId = id ?? `slider-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const displayValue = formatValue ? formatValue(value) : value.toFixed(step < 1 ? 1 : 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {label && (
          <Label.Root htmlFor={inputId} className={styles.label}>
            {label}
          </Label.Root>
        )}
        {showValue && (
          <span className={styles.value}>
            {displayValue}
            {unit && <span className={styles.unit}> {unit}</span>}
          </span>
        )}
      </div>
      <SliderPrimitive.Root
        id={inputId}
        className={styles.root}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onValueChange(v)}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={styles.thumb} aria-label={label} />
      </SliderPrimitive.Root>
      <div className={styles.bounds}>
        <span>{min}{unit ? ` ${unit}` : ''}</span>
        <span>{max}{unit ? ` ${unit}` : ''}</span>
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};
