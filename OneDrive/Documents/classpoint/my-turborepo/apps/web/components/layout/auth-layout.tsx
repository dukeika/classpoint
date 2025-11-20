/**
 * Auth Layout
 * Layout for authentication pages (login, register, forgot password)
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side - Branding */}
        <div className="relative hidden h-full flex-col bg-primary p-10 text-primary-foreground lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />

          <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span>ClassPoint</span>
          </div>

          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;ClassPoint has transformed how we manage our school.
                Everything is streamlined and accessible in one place.&rdquo;
              </p>
              <footer className="text-sm opacity-80">
                Dr. Sarah Johnson, Principal
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">ClassPoint</span>
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex flex-col space-y-2 text-center">
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}

            {/* Form Content */}
            <div className={cn('', className)}>{children}</div>

            {/* Footer Links */}
            <p className="px-8 text-center text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
