import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';

describe('default API request constants', () => {
  it('defines the default language', () => {
    expect(DEFAULT_LANGUAGE).toBe('fr-FR');
  });

  it('defines the default page', () => {
    expect(DEFAULT_PAGE).toBe('1');
  });

  it('defines the default region', () => {
    expect(DEFAULT_REGION).toBe('FR');
  });
});
