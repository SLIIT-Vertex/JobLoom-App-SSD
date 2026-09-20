import { describe, expect, it } from 'vitest';
import { sanitizeJobDescription } from './sanitizeJobDescription';

describe('sanitizeJobDescription', () => {
  it('strips script tags', () => {
    const output = sanitizeJobDescription(
      '<p>Safe padding text here.</p><script>alert("M3-STORED-XSS-PROOF")</script>'
    );

    expect(output).not.toMatch(/<script/i);
    expect(output).toContain('Safe padding text here');
  });

  it('strips img onerror handlers', () => {
    const output = sanitizeJobDescription(
      '<p>Need help with harvesting crops in the field.</p><img src=x onerror="alert(1)">'
    );

    expect(output).not.toMatch(/<img/i);
    expect(output).not.toMatch(/onerror/i);
    expect(output).toContain('Need help with harvesting crops');
  });

  it('keeps allow-listed formatting', () => {
    const output = sanitizeJobDescription(
      '<p><strong>Need help with harvesting crops in the field.</strong></p>'
    );

    expect(output).toContain('<p>');
    expect(output).toContain('<strong>');
  });

  it('returns an empty string for missing input', () => {
    expect(sanitizeJobDescription('')).toBe('');
    expect(sanitizeJobDescription(null)).toBe('');
    expect(sanitizeJobDescription(undefined)).toBe('');
  });
});
