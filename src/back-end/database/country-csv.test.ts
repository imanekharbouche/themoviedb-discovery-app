import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './country-csv.ts';

describe('country-csv', () => {
  it('parses BOM, CRLF, reordered headers, quoted commas, and escaped quotes', () => {
    const csv =
      '\ufeffNAME,CODE\r\n"United, States",US\r\n"Pays ""test""",FR\r\n';

    expect(parseCountriesCsv(csv)).toEqual([
      { code: 'US', name: 'United, States' },
      { code: 'FR', name: 'Pays "test"' },
    ]);
  });

  it('ignores empty lines and accepts a header-only document', () => {
    expect(parseCountriesCsv('code,name\n\n')).toEqual([]);
    expect(parseCountriesCsv('name,code')).toEqual([]);
  });

  it('rejects invalid headers, values, and CSV syntax', () => {
    expect(() => parseCountriesCsv('')).toThrow(/header is missing/);
    expect(() => parseCountriesCsv('id,name\nFR,France')).toThrow(
      /expected code and name headers/,
    );
    expect(() => parseCountriesCsv('code,name\nfr,France')).toThrow(
      /invalid code/,
    );
    expect(() => parseCountriesCsv('code,name\nFRA,France')).toThrow(
      /invalid code/,
    );
    expect(() => parseCountriesCsv('code,name\nFR,')).toThrow(/empty name/);
    expect(() => parseCountriesCsv('code,name\nFR,"France')).toThrow(
      /Invalid countries CSV/,
    );
  });
});
