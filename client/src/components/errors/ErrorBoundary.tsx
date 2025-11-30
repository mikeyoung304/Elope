/**
 * React Error Boundary Component
 * Catches errors in component tree and displays fallback UI
 * Integrated with Sentry for error reporting
 */

import React from 'react';
import { ErrorFallback } from './ErrorFallback';
import { captureException } from '../../lib/sentry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  name?: string; // Boundary name for better error context
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches React component errors
 * Use this to wrap sections of your app that might fail
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback and name
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback} name="UserProfile">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development only
    if (import.meta.env.DEV) {
      console.error('Error boundary caught:', error, errorInfo);
    }

    // Report to Sentry with React context
    captureException(error, {
      boundary: this.props.name || 'Unknown',
      componentStack: errorInfo.componentStack,
      location: window.location.href,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || ErrorFallback;
      return <Fallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}
