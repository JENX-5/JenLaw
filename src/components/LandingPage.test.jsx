import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders correctly and displays essential elements', () => {
    render(<LandingPage onOpenApp={vi.fn()} />);
    
    // Check main title
    expect(screen.getByRole('heading', { name: /Understand Legal Documents/i })).toBeInTheDocument();
    
    // Check navigation
    expect(screen.getByRole('navigation', { name: /Main navigation/i })).toBeInTheDocument();
    
    // Check disclaimer
    expect(screen.getByRole('note', { name: /Legal disclaimer/i })).toBeInTheDocument();
  });

  it('calls onOpenApp when Get Started is clicked', () => {
    const handleOpenApp = vi.fn();
    render(<LandingPage onOpenApp={handleOpenApp} />);
    
    const getStartedBtn = screen.getByRole('button', { name: /Get Started/i });
    fireEvent.click(getStartedBtn);
    
    expect(handleOpenApp).toHaveBeenCalledTimes(1);
  });
});
