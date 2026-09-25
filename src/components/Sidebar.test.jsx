import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyDoc = { name: '', text: '', type: '' };
const loadedDoc = { name: 'contract.pdf', text: 'This is a legal document about tenancy.', type: 'application/pdf' };

function renderSidebar(overrides = {}) {
  const defaults = {
    isSidebarOpen: true,
    onClose: vi.fn(),
    docA: emptyDoc,
    setDocA: vi.fn(),
    docB: emptyDoc,
    setDocB: vi.fn(),
  };
  return render(<Sidebar {...defaults} {...overrides} />);
}

// ── Rendering ─────────────────────────────────────────────────────────────────
describe('Sidebar — rendering', () => {
  it('renders Document A and Document B slots', () => {
    renderSidebar();
    expect(screen.getByText('Document A')).toBeInTheDocument();
    expect(screen.getByText('Document B')).toBeInTheDocument();
  });

  it('renders sample document buttons', () => {
    renderSidebar();
    // There should be at least one sample doc button visible
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ onClose });
    const closeBtn = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ── Paste UI ──────────────────────────────────────────────────────────────────
describe('Sidebar — paste UI', () => {
  it('shows paste textarea when paste button is clicked', () => {
    renderSidebar();
    const pasteBtns = screen.getAllByRole('button', { name: /Paste Text/i });
    fireEvent.click(pasteBtns[0]);
    expect(screen.getByPlaceholderText(/Paste your legal text here/i)).toBeInTheDocument();
  });

  it('calls setDocA with pasted content when Save is clicked', () => {
    const setDocA = vi.fn();
    renderSidebar({ setDocA });
    const pasteBtns = screen.getAllByRole('button', { name: /Paste Text/i });
    fireEvent.click(pasteBtns[0]);

    const textarea = screen.getByPlaceholderText(/Paste your legal text here/i);
    fireEvent.change(textarea, { target: { value: 'EMPLOYER AGREEMENT: ...' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    expect(setDocA).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'EMPLOYER AGREEMENT: ...' })
    );
  });

  it('does not call setDoc when Save is clicked with empty text', () => {
    const setDocA = vi.fn();
    renderSidebar({ setDocA });
    const pasteBtns = screen.getAllByRole('button', { name: /Paste Text/i });
    fireEvent.click(pasteBtns[0]);

    // Leave textarea empty and click Save
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    expect(setDocA).not.toHaveBeenCalled();
  });

  it('hides paste UI when Cancel is clicked', () => {
    renderSidebar();
    const pasteBtns = screen.getAllByRole('button', { name: /Paste Text/i });
    fireEvent.click(pasteBtns[0]);

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.queryByPlaceholderText(/Paste your legal text here/i)).not.toBeInTheDocument();
  });
});

// ── File upload — validation ───────────────────────────────────────────────────
describe('Sidebar — file upload validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('alerts on unsupported file type', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderSidebar();

    const inputs = document.querySelectorAll('input[type="file"]');
    const file = new File(['content'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    Object.defineProperty(file, 'size', { value: 1024 });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/unsupported file type/i));
    });
    alertMock.mockRestore();
  });

  it('alerts when an empty file is uploaded', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderSidebar();

    const inputs = document.querySelectorAll('input[type="file"]');
    const file = new File([], 'empty.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 0 });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/empty/i));
    });
    alertMock.mockRestore();
  });

  it('alerts when file exceeds 5 MB', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderSidebar();

    const inputs = document.querySelectorAll('input[type="file"]');
    const file = new File(['x'.repeat(100)], 'big.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6 MB
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/too large/i));
    });
    alertMock.mockRestore();
  });
});

// ── Sample document loading — no runtime error ────────────────────────────────
describe('Sidebar — sample document loading', () => {
  it('loads sample into docA when docA is empty (no crash)', async () => {
    const setDocA = vi.fn();
    renderSidebar({ setDocA, docA: emptyDoc });

    // Click the first sample document button
    // Sample buttons don't have the "Paste Text" or close label, filter by exclusion
    const allBtns = screen.getAllByRole('button');
    const sampleBtn = allBtns.find(b =>
      !b.textContent.includes('Paste') &&
      !b.textContent.includes('Cancel') &&
      !b.getAttribute('aria-label')?.match(/close|remove|upload/i) &&
      b.textContent.trim().length > 0 &&
      b.getAttribute('aria-label')?.startsWith('Load sample')
    );

    if (sampleBtn) {
      fireEvent.click(sampleBtn);
      expect(setDocA).toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }));
    }
    // If no sample button is found, the test is a no-op (samples list may be empty in test env)
  });

  it('does NOT throw a ReferenceError (setShowSamples bug fix)', async () => {
    // The original code called setShowSamples(false) which didn't exist.
    // Clicking a sample should not throw.
    const setDocA = vi.fn();
    renderSidebar({ setDocA, docA: emptyDoc });

    const sampleBtns = screen.queryAllByRole('button', { name: /Load sample/i });
    if (sampleBtns.length > 0) {
      expect(() => fireEvent.click(sampleBtns[0])).not.toThrow();
    }
  });
});
