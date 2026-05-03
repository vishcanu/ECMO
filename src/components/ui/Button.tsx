import React, { forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className, ...props }, ref) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      loading ? styles.loading : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} disabled={loading || props.disabled} {...props}>
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          icon && <span className={styles.iconLeft}>{icon}</span>
        )}
        {children && <span>{children}</span>}
        {iconRight && !loading && <span className={styles.iconRight}>{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
