import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes.ts';

const EXPECTED_HEADERS = ['id', 'name'];

export function parseGenresCsv(csvContent: string): Genre[] {
  let records: string[][];
  try {
    records = parse(csvContent, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid genres CSV: ${String(error)}`);
  }

  if (records.length === 0) {
    throw new Error('Invalid genres CSV: the header is missing');
  }

  const headers = records[0].map((header) => header.trim().toLowerCase());
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    new Set(headers).size !== EXPECTED_HEADERS.length ||
    !EXPECTED_HEADERS.every((header) => headers.includes(header))
  ) {
    throw new Error('Invalid genres CSV: expected id and name headers');
  }

  const idIndex = headers.indexOf('id');
  const nameIndex = headers.indexOf('name');

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2;
    const idValue = record[idIndex].trim();
    const name = record[nameIndex].trim();

    if (!/^\d+$/.test(idValue)) {
      throw new Error(
        `Invalid genres CSV: row ${rowNumber} has an invalid positive id`,
      );
    }

    const id = Number(idValue);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(
        `Invalid genres CSV: row ${rowNumber} has an invalid positive id`,
      );
    }

    if (name.length === 0) {
      throw new Error(`Invalid genres CSV: row ${rowNumber} has an empty name`);
    }

    return { id, name };
  });
}
