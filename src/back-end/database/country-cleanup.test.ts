import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './country-csv.ts';
import {
  deleteUnusedCountries,
  getCountries,
  upsertCountries,
} from './country-repository.ts';
import { initializeSchema } from './schema.ts';

describe('import CSV et nettoyage SQLite des pays', () => {
  let database: DatabaseSync;
  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    initializeSchema(database);
  });
  afterEach(() => database.close());

  it('insère et actualise les valeurs CSV sans doublon', () => {
    upsertCountries(
      database,
      parseCountriesCsv('code,name\nFR,France\nUS,USA'),
    );
    upsertCountries(
      database,
      parseCountriesCsv('NAME,CODE\nEtats-Unis,US\nUnited States,US'),
    );
    expect(
      database.prepare('SELECT * FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM countries').get(),
    ).toEqual({ count: 2 });
  });

  it('annule un import CSV après une première écriture si SQLite rejette la suite', () => {
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);
    database.exec(`CREATE TRIGGER reject_country BEFORE INSERT ON countries
      WHEN NEW.code = 'US' BEGIN SELECT RAISE(FAIL, 'import rejected'); END`);
    const countries = parseCountriesCsv(
      'code,name\nFR,Nom temporaire\nGB,United Kingdom\nUS,United States',
    );
    expect(() => upsertCountries(database, countries)).toThrow(
      /import rejected/,
    );
    expect(database.prepare('SELECT * FROM countries').all()).toEqual([
      { code: 'FR', name: 'France' },
    ]);
    database.exec('DROP TRIGGER reject_country');
    upsertCountries(database, [{ code: 'US', name: 'United States' }]);
    expect(getCountries(database)).toHaveLength(2);
  });

  it('supprime uniquement les pays sans film et conserve les associations', () => {
    upsertCountries(
      database,
      parseCountriesCsv(
        'code,name\nFR,France\nGB,United Kingdom\nUS,United States',
      ),
    );
    database.exec(`INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
      VALUES (1, 'Film', 'Film', 'fr', '', '2026-01-01');
      INSERT INTO production_countries VALUES (1, 'FR');`);
    expect(deleteUnusedCountries(database)).toBe(2);
    expect(database.prepare('SELECT * FROM countries').all()).toEqual([
      { code: 'FR', name: 'France' },
    ]);
    expect(
      database.prepare('SELECT * FROM production_countries').all(),
    ).toEqual([{ movie_id: 1, country_code: 'FR' }]);
    expect(deleteUnusedCountries(database)).toBe(0);
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('restaure toutes les suppressions après une erreur partielle puis permet de recommencer', () => {
    upsertCountries(database, [
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    // RAISE(FAIL) laisse les écritures précédentes du DELETE en cours dans la transaction.
    // Le rollback de la fonction doit annuler les suppressions et les effets du trigger.
    database.exec(`CREATE TABLE cleanup_log (country_code TEXT);
      CREATE TRIGGER fail_cleanup AFTER DELETE ON countries BEGIN
        INSERT INTO cleanup_log VALUES (OLD.code);
        SELECT CASE WHEN OLD.code = 'US' THEN RAISE(FAIL, 'cleanup failed') END;
      END;`);
    expect(() => deleteUnusedCountries(database)).toThrow(/cleanup failed/);
    expect(
      database.prepare('SELECT * FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    expect(database.prepare('SELECT * FROM cleanup_log').all()).toEqual([]);
    database.exec('DROP TRIGGER fail_cleanup');
    expect(deleteUnusedCountries(database)).toBe(2);
    expect(getCountries(database)).toEqual([]);
    expect(database.prepare('PRAGMA integrity_check').get()).toEqual({
      integrity_check: 'ok',
    });
  });
});
