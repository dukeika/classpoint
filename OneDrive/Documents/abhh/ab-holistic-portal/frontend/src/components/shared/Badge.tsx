/**
 * Reusable Badge Component
 */

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  className,
}) => {
  const baseClasses = [
    'inline-flex items-center font-medium',
    rounded ? 'rounded-full' : 'rounded-md',
  ];

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  const sizes = {
    sm: dot ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs',
    md: dot ? 'px-2 py-1 text-sm' : 'px-2.5 py-1 text-sm',
    lg: dot ? 'px-2.5 py-1.5 text-base' : 'px-3 py-1.5 text-base',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <span className={classes}>
      {dot && (
        <span className={clsx('rounded-full mr-1', dotSizes[size], 'bg-current opacity-75')} />
      )}
      {children}
    </span>
  );
};

export default Badge;