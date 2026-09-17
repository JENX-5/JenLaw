import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickActions from './QuickActions';

describe('QuickActions', () => {
  it('renders correctly', () => {
    render(<QuickActions onRunAction={vi.fn()} hasDocument={false} hasTwoDocuments={false} />);
    expect(screen.getByRole('toolbar', { name: /quick actions/i })).toBeInTheDocument();
  });

  it('disables buttons when no documents are loaded', () => {
    render(<QuickActions onRunAction={vi.fn()} hasDocument={false} hasTwoDocuments={false} />);
    
    // Check one of the regular actions
    const summaryBtn = screen.getByRole('button', { name: /Document Summary/i });
    expect(summaryBtn).toBeDisabled();

    // Check action that needs two documents
    const compareBtn = screen.getByRole('button', { name: /Compare/i });
    expect(compareBtn).toBeDisabled();
  });

  it('enables single-doc actions when one document is loaded', () => {
    render(<QuickActions onRunAction={vi.fn()} hasDocument={true} hasTwoDocuments={false} />);
    
    const summaryBtn = screen.getByRole('button', { name: /Document Summary/i });
    expect(summaryBtn).not.toBeDisabled();

    const compareBtn = screen.getByRole('button', { name: /Compare/i });
    expect(compareBtn).toBeDisabled();
  });

  it('enables all actions when two documents are loaded', () => {
    render(<QuickActions onRunAction={vi.fn()} hasDocument={true} hasTwoDocuments={true} />);
    
    const summaryBtn = screen.getByRole('button', { name: /Document Summary/i });
    expect(summaryBtn).not.toBeDisabled();

    const compareBtn = screen.getByRole('button', { name: /Compare/i });
    expect(compareBtn).not.toBeDisabled();
  });

  it('calls onRunAction with correct parameters when clicked', () => {
    const handleRunAction = vi.fn();
    render(<QuickActions onRunAction={handleRunAction} hasDocument={true} hasTwoDocuments={false} />);
    
    const summaryBtn = screen.getByRole('button', { name: /Document Summary/i });
    fireEvent.click(summaryBtn);
    
    expect(handleRunAction).toHaveBeenCalledWith('Document Summary', expect.any(String));
  });
});
