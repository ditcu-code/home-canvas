/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  // If href is provided, renders an anchor element
  href?: string;
  download?: boolean | string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  ghost: 'bg-zinc-100 text-zinc-900 border border-zinc-300 hover:bg-zinc-200 shadow-sm',
  link: 'bg-transparent text-blue-600 hover:text-blue-800 p-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm md:text-base px-4 py-2',
};

const baseClasses = 'inline-flex items-center justify-center rounded-md transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  href,
  download,
  target,
  rel,
  ariaLabel,
}) => {
  const classes = [baseClasses, variantClasses[variant], variant !== 'link' ? sizeClasses[size] : '', className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a
        href={href}
        download={download}
        target={target}
        rel={rel}
        onClick={onClick}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-label={ariaLabel} className={classes}>
      {children}
    </button>
  );
};

export default Button;

