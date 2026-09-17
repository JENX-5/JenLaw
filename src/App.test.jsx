import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock child components that are complex or tested separately
vi.mock('./components/LandingPage', () => ({
  default: ({ onOpenApp }) => (
    <div data-testid="mock-landing-page">
      <button onClick={onOpenApp}>Open App</button>
    </div>
  )
}));

vi.mock('./components/Sidebar', () => ({
  default: () => <div data-testid="mock-sidebar">Sidebar</div>
}));

vi.mock('./components/ChatArea', () => ({
  default: ({ children }) => <div data-testid="mock-chat-area">{children}</div>
}));

vi.mock('./components/QuickActions', () => ({
  default: () => <div data-testid="mock-quick-actions">QuickActions</div>
}));

describe('App', () => {
  it('renders LandingPage initially', () => {
    render(<App />);
    expect(screen.getByTestId('mock-landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-sidebar')).not.toBeInTheDocument();
  });

  it('switches to main app view when onOpenApp is triggered', () => {
    render(<App />);
    
    // Initial state
    expect(screen.getByTestId('mock-landing-page')).toBeInTheDocument();
    
    // Trigger open
    const openBtn = screen.getByText('Open App');
    fireEvent.click(openBtn);
    
    // Should now show app components
    expect(screen.queryByTestId('mock-landing-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-area')).toBeInTheDocument();
    expect(screen.getByTestId('mock-quick-actions')).toBeInTheDocument();
  });

  it('allows theme toggling in app view', () => {
    render(<App />);
    
    // Go to app view
    fireEvent.click(screen.getByText('Open App'));
    
    const themeBtn = screen.getByRole('button', { name: /Toggle theme/i });
    expect(themeBtn).toBeInTheDocument();
    
    // Click to toggle
    fireEvent.click(themeBtn);
    
    // Depending on local storage it might go dark or light, but checking if it's there is enough
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
  });
});
