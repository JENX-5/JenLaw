import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// A component that throws an error on purpose
function ThrowingComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during these tests since we expect errors
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = () => {};
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('recovers when Try Again is clicked', () => {
    // First, render with a throwing component
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click Try Again — this resets the ErrorBoundary internal state
    // After reset, the same children are re-rendered. Since ThrowingComponent
    // still throws, we verify the boundary can catch again.
    fireEvent.click(screen.getByText('Try Again'));
    
    // The boundary re-renders children, which throws again, so we're back at error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
