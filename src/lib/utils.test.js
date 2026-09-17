import { describe, it, expect } from 'vitest';
import { generateId, escapeHtml, formatTime, renderMarkdown } from './utils';

describe('utils.js', () => {
  it('generateId should return a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('escapeHtml should escape HTML entities', () => {
    const unsafe = '<div>"Hello" & \'World\'</div>';
    const safe = escapeHtml(unsafe);
    expect(safe).toBe('&lt;div&gt;&quot;Hello&quot; &amp; &#039;World&#039;&lt;/div&gt;');
  });

  it('formatTime should return formatted time string', () => {
    const date = new Date('2024-01-01T14:30:00');
    const timeStr = formatTime(date);
    expect(timeStr).toMatch(/2:30 PM/i);
  });

  it('renderMarkdown should convert md to safe html', () => {
    const md = '# Hello\n\n**World**';
    const html = renderMarkdown(md);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<strong>World</strong>');
  });

  it('renderMarkdown should sanitize unsafe html', () => {
    const md = '<script>alert(1)</script>\n# Hello';
    const html = renderMarkdown(md);
    expect(html).not.toContain('<script>');
    expect(html).toContain('<h1>Hello</h1>');
  });
});
