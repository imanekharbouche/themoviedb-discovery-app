import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/MoviesTypes.ts';

export function getCountryByCode(
  database: DatabaseSync,
  code: string,
): Country | undefined {
  return database
    .prepare('SELECT code, name FROM countries WHERE code = ?')
    .get(code) as Country | undefined;
}

export function getCountries(database: DatabaseSync): Country[] {
  return database
    .prepare('SELECT code, name FROM countries ORDER BY code ASC')
    .all() as Country[];
}

export function upsertCountries(
  database: DatabaseSync,
  countries: Iterable<Country>,
): void {
  const statement = database.prepare(`
    INSERT INTO countries (code, name) VALUES (?, ?)
    ON CONFLICT(code) DO UPDATE SET name = excluded.name
  `);

  const savepoint = 'upsert_countries';
  const hasOuterTransaction = database.isTransaction;
  if (hasOuterTransaction) database.exec(`SAVEPOINT ${savepoint}`);
  else database.exec('BEGIN');
  try {
    for (const country of countries) {
      statement.run(country.code, country.name);
    }
    if (hasOuterTransaction) database.exec(`RELEASE SAVEPOINT ${savepoint}`);
    else database.exec('COMMIT');
  } catch (error) {
    if (hasOuterTransaction) {
      database.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      database.exec(`RELEASE SAVEPOINT ${savepoint}`);
    } else database.exec('ROLLBACK');
    throw error;
  }
}

export function deleteUnusedCountries(database: DatabaseSync): number {
  database.exec('BEGIN');
  try {
    const result = database
      .prepare(`
        DELETE FROM countries
        WHERE NOT EXISTS (
          SELECT 1
          FROM production_countries
          WHERE production_countries.country_code = countries.code
        )
      `)
      .run();
    database.exec('COMMIT');
    return Number(result.changes);
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
