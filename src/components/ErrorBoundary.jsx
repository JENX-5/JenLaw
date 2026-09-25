import React from 'react';

/**
 * ErrorBoundary catches unhandled JavaScript errors in child components,
 * preventing the entire application from crashing. Instead, a user-friendly
 * fallback UI is displayed with an option to recover.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, this could send to an error reporting service
    console.error('[JenLaw ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'var(--font, system-ui, sans-serif)',
          color: 'var(--text, #1a1a1a)',
          background: 'var(--bg, #ffffff)'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An unexpected error occurred. Your documents are safe — try refreshing or click below to recover.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px',
              background: 'var(--navy, #1E3A5F)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
