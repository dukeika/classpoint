import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
  center?: boolean;
}

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className,
  text,
  center = false,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-500',
    white: 'border-white',
    gray: 'border-gray-400',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const spinner = (
    <svg
      className={clsx(
        'animate-spin',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className={clsx('opacity-75', colorClasses[color])}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (text) {
    return (
      <div
        className={clsx(
          'flex items-center space-x-3',
          center && 'justify-center'
        )}
      >
        {spinner}
        <span className={clsx('text-gray-700', textSizeClasses[size])}>
          {text}
        </span>
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex justify-center items-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;