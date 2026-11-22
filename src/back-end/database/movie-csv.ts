import { parse } from 'csv-parse/sync';
import type { Country } from '../types/MoviesTypes.ts';
import type { MovieWithDetails } from './movie-repository.ts';

const EXPECTED_HEADERS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime',
  'budget',
  'revenue',
  'genres',
  'production_countries',
];

function requiredValue(record: string[], index: number, name: string): string {
  const value = record[index]?.trim();
  if (!value) throw new Error(`Invalid movies CSV: missing ${name}`);
  return value;
}

function numberValue(
  record: string[],
  index: number,
  name: string,
  integer = false,
): number {
  const value = requiredValue(record, index, name);
  const result = Number(value);
  if (!Number.isFinite(result) || (integer && !Number.isInteger(result))) {
    throw new Error(`Invalid movies CSV: ${name} must be a number`);
  }
  return result;
}

function optionalPositiveNumber(
  record: string[],
  index: number,
  name: string,
  integer = false,
): number | undefined {
  const value = record[index]?.trim();
  if (!value) return undefined;
  const result = Number(value);
  if (
    !Number.isFinite(result) ||
    (integer && !Number.isInteger(result)) ||
    result <= 0
  ) {
    throw new Error(`Invalid movies CSV: ${name} must be positive`);
  }
  return result;
}

function jsonValue<T>(record: string[], index: number, name: string): T {
  try {
    return JSON.parse(requiredValue(record, index, name)) as T;
  } catch (error) {
    throw new Error(
      `Invalid movies CSV: ${name} must be valid JSON: ${String(error)}`,
    );
  }
}

export type CsvMovie = MovieWithDetails & {
  countries: Country[];
};

export function parseMoviesCsv(csvContent: string): CsvMovie[] {
  let records: string[][];
  try {
    records = parse(csvContent, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid movies CSV: ${String(error)}`);
  }

  if (records.length === 0) {
    throw new Error('Invalid movies CSV: the header is missing');
  }

  const headers = records[0].map((header) => header.trim().toLowerCase());
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    headers.some((header, index) => header !== EXPECTED_HEADERS[index])
  ) {
    throw new Error('Invalid movies CSV: unexpected headers');
  }

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2;
    try {
      const genres = jsonValue<number[]>(record, 14, 'genres');
      const countries = jsonValue<Array<{ iso_3166_1: string; name: string }>>(
        record,
        15,
        'production_countries',
      );
      if (
        !Array.isArray(genres) ||
        genres.some((id) => !Number.isInteger(id) || id <= 0) ||
        !Array.isArray(countries) ||
        countries.some(
          (country) =>
            !country ||
            typeof country.iso_3166_1 !== 'string' ||
            typeof country.name !== 'string' ||
            country.name.trim().length === 0,
        )
      ) {
        throw new Error('associations are invalid');
      }

      return {
        id: numberValue(record, 0, 'id', true),
        title: requiredValue(record, 1, 'title'),
        original_title: requiredValue(record, 2, 'original_title'),
        original_language: requiredValue(record, 3, 'original_language'),
        overview: record[4].trim(),
        release_date: record[5].trim(),
        popularity: numberValue(record, 6, 'popularity'),
        vote_average: numberValue(record, 7, 'vote_average'),
        vote_count: numberValue(record, 8, 'vote_count', true),
        poster_path: record[9].trim(),
        backdrop_path: record[10].trim(),
        runtime_minutes: optionalPositiveNumber(record, 11, 'runtime', true),
        budget: optionalPositiveNumber(record, 12, 'budget', true),
        revenue: optionalPositiveNumber(record, 13, 'revenue', true),
        genre_ids: [...new Set(genres)],
        countries: countries.map((country) => ({
          code: country.iso_3166_1,
          name: country.name.trim(),
        })),
      };
    } catch (error) {
      throw new Error(`Invalid movies CSV: row ${rowNumber}: ${String(error)}`);
    }
  });
}
