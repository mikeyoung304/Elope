/**
 * Default error fallback UI
 * Displayed when an error boundary catches an error
 */

import React from 'react';

interface Props {
  error: Error;
  resetError: () => void;
}

/**
 * Default error fallback component
 * Displays a user-friendly error message with option to retry
 */
export function ErrorFallback({ error, resetError }: Props) {
  const isDev = import.meta.env.DEV;

  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '2rem auto',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: '#ef4444', margin: '0 auto' }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Something went wrong
      </h1>

      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        We're sorry for the inconvenience. Please try again.
      </p>

      {isDev && (
        <details
          style={{
            marginTop: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Error details (development only)
          </summary>
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontWeight: '600', color: '#ef4444', marginBottom: '0.5rem' }}>
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre
                style={{
                  fontSize: '0.75rem',
                  color: '#4b5563',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}

      <button
        onClick={resetError}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
        }}
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Minimal error fallback for widget mode
 */
export function MinimalErrorFallback({ error, resetError }: Props) {
  return (
    <div style={{ padding: '1rem', textAlign: 'center', background: '#fef2f2' }}>
      <p style={{ color: '#991b1b', marginBottom: '0.5rem' }}>
        An error occurred. Please try again.
      </p>
      <button
        onClick={resetError}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
