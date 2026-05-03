import React, { forwardRef } from 'react';
import * as Label from '@radix-ui/react-label';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  unit?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, unit, icon, containerClassName, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={`${styles.container} ${containerClassName ?? ''}`}>
        {label && (
          <Label.Root htmlFor={inputId} className={styles.label}>
            {label}
          </Label.Root>
        )}
        <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${icon ? styles.withIcon : ''} ${unit ? styles.withUnit : ''} ${className ?? ''}`}
            {...props}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
        {error && <span className={styles.error}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
