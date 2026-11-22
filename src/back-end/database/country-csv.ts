import { parse } from 'csv-parse/sync';
import type { Country } from '../types/MoviesTypes.ts';

const EXPECTED_HEADERS = ['code', 'name'];

export function parseCountriesCsv(csvContent: string): Country[] {
  let records: string[][];
  try {
    records = parse(csvContent, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid countries CSV: ${String(error)}`);
  }

  if (records.length === 0) {
    throw new Error('Invalid countries CSV: the header is missing');
  }

  const headers = records[0].map((header) => header.trim().toLowerCase());
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    new Set(headers).size !== EXPECTED_HEADERS.length ||
    !EXPECTED_HEADERS.every((header) => headers.includes(header))
  ) {
    throw new Error('Invalid countries CSV: expected code and name headers');
  }

  const codeIndex = headers.indexOf('code');
  const nameIndex = headers.indexOf('name');

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2;
    const code = record[codeIndex].trim();
    const name = record[nameIndex].trim();

    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(
        `Invalid countries CSV: row ${rowNumber} has an invalid code`,
      );
    }

    if (name.length === 0) {
      throw new Error(
        `Invalid countries CSV: row ${rowNumber} has an empty name`,
      );
    }

    return { code, name };
  });
}
