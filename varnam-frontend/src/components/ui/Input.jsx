import { forwardRef } from 'react'

/**
 * Labelled input field with optional error message and leading icon.
 *
 * @param {string}    label       — visible label above the input
 * @param {string}    error       — red error text shown below the input
 * @param {ReactNode} icon        — optional icon rendered inside the left edge
 * @param {string}    className   — extra classes on the wrapper div
 */
const Input = forwardRef(function Input(
  { label, error, icon, className = '', id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-body font-medium text-neutral-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'input',
            icon ? 'pl-10' : '',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
      </div>

      {error && (
        <p className="text-xs font-body text-red-600 mt-0.5">{error}</p>
      )}
    </div>
  )
})

export default Input
