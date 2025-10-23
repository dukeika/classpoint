/**
 * Reusable Input Component
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'underlined';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  fullWidth = false,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = [
    'block w-full rounded-md border transition-colors duration-200',
    'focus:ring-2 focus:ring-offset-0 focus:outline-none',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
  ];

  const variants = {
    default: [
      'border-gray-300 bg-white',
      'focus:border-blue-500 focus:ring-blue-500',
      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
    ],
    filled: [
      'border-gray-200 bg-gray-50',
      'focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
    ],
    underlined: [
      'border-0 border-b-2 border-gray-300 bg-transparent rounded-none',
      'focus:border-blue-500 focus:ring-0',
      error ? 'border-red-300 focus:border-red-500' : '',
    ],
  };

  const sizes = {
    sm: ['px-3 py-2 text-sm'],
    md: ['px-4 py-2.5 text-sm'],
    lg: ['px-4 py-3 text-base'],
  };

  const iconPadding = {
    sm: leftIcon ? 'pl-9' : rightIcon ? 'pr-9' : '',
    md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
    lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
  };

  const inputClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[inputSize],
    iconPadding[inputSize],
    {
      'w-full': fullWidth,
    },
    className
  );

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;