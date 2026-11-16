import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
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

      upsertCountries(database, new Set([{ code: 'US', name: 'USA' }]));
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
      upsertCountries(database, [{ code: 'FR', name: 'France' }]);
      upsertCountries(database, []);
      expect(getCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
      expect(() =>
        upsertCountries(database, [{ code: 'FR' } as never]),
      ).toThrow();
      expect(getCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    } finally {
      database.close();
    }
  });
});

// Complément transactionnel : une erreur doit annuler les écritures déjà effectuées.
describe('atomicité du repository des pays', () => {
  it.each([
    { code: 'US', name: null as never },
    { code: null as never, name: 'Sans code' },
  ])(
    'restaure les pays existants après une violation NOT NULL : %j',
    (invalidCountry) => {
      const database = new DatabaseSync(':memory:');
      initializeSchema(database);
      try {
        upsertCountries(database, [{ code: 'FR', name: 'France' }]);
        expect(() =>
          upsertCountries(database, [
            { code: 'FR', name: 'Nom temporaire' },
            { code: 'DE', name: 'Germany' },
            invalidCountry,
          ]),
        ).toThrow(/NOT NULL constraint failed/);
        expect(
          database
            .prepare('SELECT code, name FROM countries ORDER BY code')
            .all(),
        ).toEqual([{ code: 'FR', name: 'France' }]);
        expect(
          database.prepare('SELECT COUNT(*) AS count FROM countries').get(),
        ).toEqual({ count: 1 });
        // La fonction ne doit pas laisser une transaction ouverte après l’échec.
        upsertCountries(database, [{ code: 'US', name: 'United States' }]);
        expect(getCountries(database)).toEqual([
          { code: 'FR', name: 'France' },
          { code: 'US', name: 'United States' },
        ]);
        expect(database.prepare('PRAGMA integrity_check').get()).toEqual({
          integrity_check: 'ok',
        });
      } finally {
        database.close();
      }
    },
  );
});
