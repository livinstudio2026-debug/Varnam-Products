
import { forwardRef } from 'react'

const variantClass = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:
    'inline-flex items-center justify-center gap-2 bg-red-600 text-white font-medium ' +
    'px-6 py-3 rounded-xl transition-all duration-200 hover:bg-red-700 ' +
    'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizeClass = {
  sm: 'text-sm px-4 py-2',
  md: '',           // default — sizes already in btn-* classes
  lg: 'text-base px-8 py-4',
}

/**
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading   — shows a spinner and disables the button
 * @param {boolean} fullWidth — adds w-full
 * @param {string}  as        — render as a different element (e.g. 'a')
 */
const Button = forwardRef(function Button(
  {
    variant  = 'primary',
    size     = 'md',
    loading  = false,
    fullWidth = false,
    as: Tag  = 'button',
    className = '',
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <Tag
      ref={ref}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      className={[
        variantClass[variant] ?? variantClass.primary,
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && (
        <span
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  )
})

export default Button
