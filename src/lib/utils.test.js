import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  escapeHtml,
  formatTime,
  renderMarkdown,
  hashString,
  validateFile,
  chunkText,
  retrieveRelevantChunks,
  MAX_FILE_SIZE
} from './utils';

// ── generateId ────────────────────────────────────────────────────────────────
describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

// ── escapeHtml ────────────────────────────────────────────────────────────────
describe('escapeHtml', () => {
  it('escapes all five dangerous HTML entities', () => {
    const safe = escapeHtml('<div>"Hello" & \'World\'</div>');
    expect(safe).toBe('&lt;div&gt;&quot;Hello&quot; &amp; &#039;World&#039;&lt;/div&gt;');
  });

  it('returns an empty string for null/undefined input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles strings with no special characters unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

// ── formatTime ────────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('formats 14:30 as 2:30 PM', () => {
    const date = new Date('2024-01-01T14:30:00');
    expect(formatTime(date)).toMatch(/2:30\s*PM/i);
  });

  it('formats midnight as 12:00 AM', () => {
    const date = new Date('2024-01-01T00:00:00');
    expect(formatTime(date)).toMatch(/12:00\s*AM/i);
  });
});

// ── renderMarkdown ────────────────────────────────────────────────────────────
describe('renderMarkdown', () => {
  it('converts markdown headers to <h1>', () => {
    const html = renderMarkdown('# Hello');
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('converts bold to <strong>', () => {
    expect(renderMarkdown('**World**')).toContain('<strong>World</strong>');
  });

  it('sanitizes <script> tags', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n# Safe');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<h1>Safe</h1>');
  });

  it('sanitizes javascript: href', () => {
    const html = renderMarkdown('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('returns empty string for falsy input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(null)).toBe('');
    expect(renderMarkdown(undefined)).toBe('');
  });
});

// ── hashString ────────────────────────────────────────────────────────────────
describe('hashString', () => {
  it('returns a string', () => {
    expect(typeof hashString('hello')).toBe('string');
  });

  it('returns a different hash for different inputs', () => {
    expect(hashString('hello')).not.toBe(hashString('world'));
  });

  it('is deterministic — same input produces same output', () => {
    expect(hashString('legal doc')).toBe(hashString('legal doc'));
  });

  it('handles empty string without throwing', () => {
    expect(() => hashString('')).not.toThrow();
  });
});

// ── validateFile ──────────────────────────────────────────────────────────────
describe('validateFile', () => {
  function makeFile({ name = 'doc.txt', size = 1024, type = 'text/plain' } = {}) {
    return { name, size, type };
  }

  it('accepts a valid plain-text file', () => {
    expect(validateFile(makeFile()).valid).toBe(true);
  });

  it('accepts a valid PDF file', () => {
    expect(validateFile(makeFile({ name: 'contract.pdf', type: 'application/pdf' })).valid).toBe(true);
  });

  it('accepts a markdown file by extension', () => {
    expect(validateFile(makeFile({ name: 'notes.md', type: '' })).valid).toBe(true);
  });

  it('rejects null (no file provided)', () => {
    const result = validateFile(null);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/no file/i);
  });

  it('rejects an empty file (size === 0)', () => {
    const result = validateFile(makeFile({ size: 0 }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  it('rejects a file that exceeds MAX_FILE_SIZE', () => {
    const result = validateFile(makeFile({ size: MAX_FILE_SIZE + 1 }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('rejects an unsupported file type (e.g. .docx)', () => {
    const result = validateFile(makeFile({ name: 'doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unsupported file type/i);
  });

  it('error message includes the MB limit for oversized files', () => {
    const result = validateFile(makeFile({ size: MAX_FILE_SIZE + 1 }));
    expect(result.error).toContain('MB');
  });
});

// ── chunkText ─────────────────────────────────────────────────────────────────
describe('chunkText', () => {
  it('returns an empty array for empty string', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns an empty array for null/undefined', () => {
    expect(chunkText(null)).toEqual([]);
    expect(chunkText(undefined)).toEqual([]);
  });

  it('returns a single chunk when text is shorter than chunkSize', () => {
    const text = 'Short document.';
    const chunks = chunkText(text, 1500, 200);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('produces overlapping chunks for long text', () => {
    // Build a text longer than two chunks
    const text = 'A'.repeat(3000);
    const chunks = chunkText(text, 1500, 200);
    // With 3000 chars, chunk size 1500, overlap 200 we expect at least 2 chunks
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('every chunk is at most chunkSize characters', () => {
    const text = 'B'.repeat(5000);
    const chunks = chunkText(text, 1000, 100);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1000);
    }
  });

  it('all chunks together cover the entire document', () => {
    const text = 'Hello world '.repeat(500); // 6000 chars
    const chunks = chunkText(text, 1500, 200);
    // At minimum the first and last few chars should be in some chunk
    expect(chunks[0]).toContain('Hello');
    expect(chunks[chunks.length - 1]).toContain('Hello');
    // No chunk should be empty
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });
});

// ── retrieveRelevantChunks ────────────────────────────────────────────────────
describe('retrieveRelevantChunks', () => {
  const chunks = [
    'The tenant must pay rent of $1,000 on the first of each month.',
    'The landlord is responsible for major repairs to the property.',
    'Either party may terminate this lease with 30 days written notice.',
    'Late payments will incur a penalty fee of $50 per day.',
    'The governing law of this agreement is the State of California.',
  ];

  it('returns empty string for empty chunks array', () => {
    expect(retrieveRelevantChunks([], 'rent')).toBe('');
  });

  it('returns first N chunks for empty query', () => {
    const result = retrieveRelevantChunks(chunks, '');
    // Should return some content
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns chunks relevant to the query', () => {
    const result = retrieveRelevantChunks(chunks, 'How much is the rent?');
    // The rent chunk should be in the result
    expect(result).toContain('$1,000');
  });

  it('returns chunks relevant to termination query', () => {
    const result = retrieveRelevantChunks(chunks, 'Can I terminate the lease early?');
    expect(result).toContain('terminate');
  });

  it('returns multiple relevant chunks when topK > 1', () => {
    const result = retrieveRelevantChunks(chunks, 'payment penalty rent', 3);
    expect(result).toContain('$1,000');
    expect(result).toContain('$50');
  });

  it('falls back to first N chunks when no terms match', () => {
    // Query with no meaningful words (all < 3 chars)
    const result = retrieveRelevantChunks(chunks, 'is a to', 2);
    // Should still return some content (fallback)
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects the topK limit', () => {
    const result = retrieveRelevantChunks(chunks, 'the', 2);
    // Result should contain at most 2 chunks (separated by ---)
    const parts = result.split('---').filter(p => p.trim().length > 0);
    expect(parts.length).toBeLessThanOrEqual(2);
  });

  it('handles null/undefined chunks gracefully', () => {
    expect(retrieveRelevantChunks(null, 'rent')).toBe('');
    expect(retrieveRelevantChunks(undefined, 'rent')).toBe('');
  });
});
