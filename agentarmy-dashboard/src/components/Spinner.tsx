import React from 'react';
import styles from './Spinner.module.css';

/** Predefined color variants that match the AgentArmy design system. */
export type SpinnerVariant = 'primary' | 'gold' | 'white' | 'danger' | 'success';

interface SpinnerProps {
  /**
   * The size of the spinner in pixels.
   * @default 48
   */
  size?: number;
  /**
   * The thickness of the spinner border in pixels.
   * @default 4
   */
  thickness?: number;
  /**
   * A predefined color variant. Overridden by `color` if both are provided.
   * @default 'primary'
   */
  variant?: SpinnerVariant;
  /**
   * A custom CSS color for the active arc. Overrides `variant`.
   */
  color?: string;
  /**
   * Accessible label announced by screen readers.
   * @default 'Loading...'
   */
  label?: string;
  /**
   * When true, centres the spinner inside a translucent overlay that fills
   * its nearest positioned ancestor.
   * @default false
   */
  overlay?: boolean;
  /**
   * Optional class name for custom styling.
   */
  className?: string;
  /**
   * Optional inline styles.
   */
  style?: React.CSSProperties;
}

const VARIANT_COLORS: Record<SpinnerVariant, string> = {
  primary: '#007aff',
  gold: '#d4af37',
  white: '#ffffff',
  danger: '#ff3b30',
  success: '#34c759',
};

/**
 * A reusable CSS-based spinner component for indicating loading states.
 *
 * Supports size / thickness customisation, design-system colour variants,
 * an optional full-container overlay mode, and an accessible label.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 48,
  thickness = 4,
  variant = 'primary',
  color,
  label = 'Loading...',
  overlay = false,
  className,
  style: customStyle,
}) => {
  const activeColor = color ?? VARIANT_COLORS[variant as SpinnerVariant];

  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderWidth: `${thickness}px`,
    borderLeftColor: activeColor,
    ...customStyle,
  };

  const spinner = (
    <div
      className={`${styles.spinner} ${className ?? ''}`}
      style={spinnerStyle}
      aria-label={label}
    >
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );

  if (overlay) {
    return <div className={styles.overlay}>{spinner}</div>;
  }

  return spinner;
};

export default Spinner;