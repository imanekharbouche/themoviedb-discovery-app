import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  deleteUnusedCountries,
  getCountries,
  getCountryByCode,
  upsertCountries,
} from './country-repository.ts';
import { initializeSchema } from './schema.ts';

describe('country-repository', () => {
  it('reads, inserts, updates, and orders countries from any iterable', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      expect(getCountryByCode(database, 'FR')).toBeUndefined();
      expect(getCountries(database)).toEqual([]);

      upsertCountries(
        database,
        new Set([{ code: 'US', name: 'United States' }]),
      );
      upsertCountries(database, [
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'Etats-Unis' },
        { code: 'US', name: 'United States' },
      ]);

      expect(getCountryByCode(database, 'FR')).toEqual({
        code: 'FR',
        name: 'France',
      });
      expect(getCountries(database)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
    } finally {
      database.close();
    }
  });

  it('leaves countries unchanged for an empty iterable and rejects missing names', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertCountries(database, []);
      expect(() =>
        upsertCountries(database, [{ code: 'FR' } as never]),
      ).toThrow();
    } finally {
      database.close();
    }
  });

  it('removes only countries without a movie association', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertCountries(database, [
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
      database
        .prepare(
          `INSERT INTO movies (
            id, title, original_title, original_language, overview,
            release_date, collected_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(1, 'Movie', 'Movie', 'en', '', '2020-01-01');
      database
        .prepare(
          'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
        )
        .run(1, 'FR');

      expect(deleteUnusedCountries(database)).toBe(1);
      expect(getCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    } finally {
      database.close();
    }
  });

  it('rolls back a country import when a write fails', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      expect(() =>
        upsertCountries(database, [
          { code: 'FR', name: 'France' },
          { code: undefined as never, name: 'Invalid' },
        ]),
      ).toThrow();
      expect(getCountries(database)).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('rolls back country cleanup when deletion fails', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertCountries(database, [{ code: 'FR', name: 'France' }]);
      database.exec(`
        CREATE TRIGGER fail_country_delete
        BEFORE DELETE ON countries
        BEGIN
          SELECT RAISE(ABORT, 'cleanup failed');
        END;
      `);

      expect(() => deleteUnusedCountries(database)).toThrow('cleanup failed');
      expect(getCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    } finally {
      database.close();
    }
  });
});
