import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as Label from '@radix-ui/react-label';
import styles from './Toggle.module.css';

interface ToggleProps {
  label?: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, hint, checked, onCheckedChange, disabled, id }) => {
  const inputId = id ?? `toggle-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.container}>
      <SwitchPrimitive.Root
        id={inputId}
        className={`${styles.root} ${checked ? styles.checked : ''}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
      </SwitchPrimitive.Root>
      {(label || hint) && (
        <div className={styles.text}>
          {label && (
            <Label.Root htmlFor={inputId} className={styles.label}>
              {label}
            </Label.Root>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
    </div>
  );
};
