import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

const Card = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  border = true,
  hover = false,
}: CardProps) => {
  const baseClasses = 'bg-white rounded-xl overflow-hidden';

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-soft',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        shadowClasses[shadow],
        border && 'border border-gray-200',
        hover && 'hover:shadow-lg hover:shadow-brand/10 transition-shadow duration-300',
        className
      )}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, action }: CardHeaderProps) => {
  return (
    <div className={clsx('card-header flex items-center justify-between', className)}>
      <div className="card-title">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <div className={clsx('card-content', className)}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, divider = true }: CardFooterProps) => {
  return (
    <div
      className={clsx(
        'card-footer',
        divider && 'border-t border-gray-200 pt-4 mt-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// Attach sub-components to main Card component
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;