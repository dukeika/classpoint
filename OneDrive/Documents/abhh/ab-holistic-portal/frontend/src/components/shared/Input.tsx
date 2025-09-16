import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helpText,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;

    const baseClasses =
      'block px-3 py-2 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200';

    const stateClasses = error
      ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

    const iconClasses = icon
      ? iconPosition === 'left'
        ? 'pl-10'
        : 'pr-10'
      : '';

    return (
      <div className={clsx('form-group', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="form-label"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={clsx(
                'absolute inset-y-0 flex items-center pointer-events-none z-10',
                iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'
              )}
            >
              <span className="h-5 w-5 text-gray-400">
                {icon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              baseClasses,
              stateClasses,
              iconClasses,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="form-error mt-1">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="form-help mt-1">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;