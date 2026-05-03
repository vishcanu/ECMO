import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select...',
  value,
  onValueChange,
  options,
  error,
  hint,
  disabled,
  id,
}) => {
  const inputId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.container}>
      {label && (
        <Label.Root htmlFor={inputId} className={styles.label}>
          {label}
        </Label.Root>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={inputId}
          className={`${styles.trigger} ${error ? styles.hasError : ''}`}
          aria-label={label}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown size={14} className={styles.chevron} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className={styles.content} position="popper" sideOffset={4}>
            <SelectPrimitive.ScrollUpButton className={styles.scrollButton}>
              <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className={styles.viewport}>
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={styles.item}
                >
                  <SelectPrimitive.ItemIndicator className={styles.indicator}>
                    <Check size={12} />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className={styles.scrollButton}>
              <ChevronDown size={12} />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};
