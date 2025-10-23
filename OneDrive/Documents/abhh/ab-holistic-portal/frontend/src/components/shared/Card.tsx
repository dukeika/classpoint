/**
 * Reusable Card Component
 */

import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  className,
  ...props
}) => {
  const baseClasses = [
    'rounded-lg',
    'transition-all duration-200',
  ];

  const variants = {
    default: ['bg-white', 'border border-gray-200'],
    outlined: ['bg-white', 'border-2 border-gray-300'],
    elevated: ['bg-white', 'shadow-lg border border-gray-100'],
    subtle: ['bg-gray-50', 'border border-gray-100'],
  };

  const paddings = {
    none: [],
    sm: ['p-3'],
    md: ['p-6'],
    lg: ['p-8'],
  };

  const interactionClasses = [];
  if (hover) {
    interactionClasses.push('hover:shadow-md');
  }
  if (clickable) {
    interactionClasses.push('cursor-pointer', 'hover:bg-gray-50');
  }

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    interactionClasses,
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;