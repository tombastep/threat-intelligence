import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'
export type { IconName }

const BASE_STYLES =
  'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2'

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400',
  ghost:
    'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'p-2',
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  startIcon?: IconName
  endIcon?: IconName
  isLoading?: boolean
  children?: ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  isLoading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      className={`${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${
        isDisabled ? 'cursor-not-allowed' : ''
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {startIcon && <Icon name={startIcon} className={ICON_SIZES[size]} />}
      {isLoading ? 'Loading...' : children}
      {endIcon && <Icon name={endIcon} className={ICON_SIZES[size]} />}
    </button>
  )
}
