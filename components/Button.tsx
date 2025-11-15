import React from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md'

export interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  // If href is provided, renders an anchor element
  href?: string
  download?: boolean | string
  target?: string
  rel?: string
  ariaLabel?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  // Use palette via Tailwind arbitrary colors with CSS variables
  primary:
    'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] shadow-sm',
  ghost:
    'bg-[hsl(var(--surface-2))] text-[hsl(var(--text))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface))] shadow-sm',
  // Keep link unpadded but allow size to change text size
  link: 'bg-transparent text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))] p-0',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm md:text-base px-4 py-2',
}

// For link variant we only want to affect text size (no padding)
const linkTextSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none'

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  href,
  download,
  target,
  rel,
  ariaLabel,
}) => {
  const classes = [
    baseClasses,
    variantClasses[variant],
    variant === "link" ? linkTextSizeClasses[size] : sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

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
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  )
}

export default Button
