import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema, getDatabase } from './schema.ts';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directories: string[] = [];
function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'movies-database-'));
  directories.push(directory);
  return directory;
}
afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('schema.ts', () => {
  describe('getDatabase', () => {
    it('returns a DatabaseSync instance connected to the specified database', () => {
      const directory = temporaryDirectory();
      const databasePath = join(directory, 'nested', 'movies.sqlite');

      const database = getDatabase(databasePath);
      expect(database).toBeInstanceOf(DatabaseSync);
      expect(database.prepare('PRAGMA foreign_keys').get()).toEqual({
        foreign_keys: 1,
      });
      expect(() =>
        database.prepare('INSERT INTO movie_genres VALUES (?, ?)').run(1, 18),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(() =>
        database
          .prepare('INSERT INTO production_countries VALUES (?, ?)')
          .run(1, 'US'),
      ).toThrow(/FOREIGN KEY constraint failed/);

      database.close();
    });

    it('rolls back schema initialization and rethrows when initialization fails', () => {
      const directory = temporaryDirectory();
      const databasePath = join(directory, 'movies.sqlite');
      const existingDatabase = new DatabaseSync(databasePath);
      existingDatabase.exec('CREATE TABLE movies (id INTEGER PRIMARY KEY)');
      existingDatabase.close();
      expect(() => getDatabase(databasePath)).toThrow(
        /no such column: release_year/,
      );
      const database = new DatabaseSync(databasePath);
      const tables = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name);
      expect(tables).toEqual(['movies']);
      database.close();
    });

    it('recreates the schema and removes existing data when forced', () => {
      const directory = temporaryDirectory();
      const databasePath = join(directory, 'movies.sqlite');

      const existingDatabase = getDatabase(databasePath);

      existingDatabase
        .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
        .run(18, 'Drama');
      existingDatabase.close();
      const database = getDatabase(databasePath, true);

      expect(database.prepare('SELECT * FROM genres').all()).toEqual([]);
      expect(
        database
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
          )
          .all()
          .map((row) => row.name),
      ).toEqual([
        'countries',
        'genres',
        'movie_genres',
        'movies',
        'production_countries',
      ]);
      database.close();
    });
  });

  describe('initializeSchema', () => {
    it('creates every table, index and optional movie column in the initial schema', () => {
      const database = new DatabaseSync(':memory:');
      try {
        initializeSchema(database);
        const tables = database
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
          )
          .all()
          .map((row) => row.name);
        expect(tables).toEqual([
          'countries',
          'genres',
          'movie_genres',
          'movies',
          'production_countries',
        ]);
        const indexes = database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
          .all()
          .map((row) => row.name);
        expect(indexes).toEqual(
          expect.arrayContaining([
            'movies_release_year',
            'movie_genres_genre_id',
          ]),
        );
      } finally {
        database.close();
      }
    });

    it('enforces valid dates and positive known movie measures', () => {
      const database = new DatabaseSync(':memory:');
      try {
        initializeSchema(database);

        const insertMovie = database.prepare(`
          INSERT INTO movies (
            id, title, original_title, original_language, overview,
            release_date, runtime_minutes, budget, revenue, collected_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        expect(() =>
          insertMovie.run(
            1,
            'Movie',
            'Movie',
            'en',
            '',
            'not-a-date',
            120,
            1,
            1,
            '2026-01-01T00:00:00Z',
          ),
        ).toThrow(/CHECK constraint failed/);

        expect(() =>
          insertMovie.run(
            1,
            'Movie',
            'Movie',
            'en',
            '',
            '2026-01-01',
            0,
            1,
            1,
            '2026-01-01T00:00:00Z',
          ),
        ).toThrow(/CHECK constraint failed/);

        expect(() =>
          insertMovie.run(
            1,
            'Movie',
            'Movie',
            'en',
            '',
            '2026-01-01',
            120,
            0,
            1,
            '2026-01-01T00:00:00Z',
          ),
        ).toThrow(/CHECK constraint failed/);

        expect(() =>
          insertMovie.run(
            1,
            'Movie',
            'Movie',
            'en',
            '',
            '2026-01-01',
            120,
            1,
            0,
            '2026-01-01T00:00:00Z',
          ),
        ).toThrow(/CHECK constraint failed/);

        insertMovie.run(
          1,
          'Movie',
          'Movie',
          'en',
          '',
          '2026-01-01',
          null,
          null,
          null,
          '2026-01-01T00:00:00Z',
        );

        expect(
          database
            .prepare(
              'SELECT release_year, runtime_minutes, budget, revenue FROM movies',
            )
            .get(),
        ).toEqual({
          release_year: 2026,
          runtime_minutes: null,
          budget: null,
          revenue: null,
        });
      } finally {
        database.close();
      }
    });

    it('prevents duplicate movie associations while preserving catalog references', () => {
      const database = new DatabaseSync(':memory:');
      try {
        initializeSchema(database);
        database
          .prepare(
            'INSERT INTO movies (id, title, original_title, original_language, overview, collected_at) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .run(1, 'Movie', 'Movie', 'en', '', '2026-01-01T00:00:00Z');
        database
          .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
          .run(18, 'Drama');
        database
          .prepare('INSERT INTO countries (code, name) VALUES (?, ?)')
          .run('FR', 'France');

        database
          .prepare(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
          )
          .run(1, 18);
        database
          .prepare(
            'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
          )
          .run(1, 'FR');

        expect(() =>
          database
            .prepare(
              'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
            )
            .run(1, 18),
        ).toThrow(/UNIQUE constraint failed/);
        expect(() =>
          database
            .prepare(
              'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
            )
            .run(1, 'FR'),
        ).toThrow(/UNIQUE constraint failed/);
      } finally {
        database.close();
      }
    });
  });
});

describe('intégrité du schéma SQLite', () => {
  it('conserve les données après réinitialisation et supprime seulement les associations en cascade', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec('PRAGMA foreign_keys = ON');
      initializeSchema(database);
      database.exec(`
        INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
        VALUES (1, 'Film', 'Film', 'fr', '', '2026-01-01');
        INSERT INTO genres VALUES (18, 'Drame');
        INSERT INTO countries VALUES ('FR', 'France');
        INSERT INTO movie_genres VALUES (1, 18);
        INSERT INTO production_countries VALUES (1, 'FR');
      `);
      initializeSchema(database);
      expect(() =>
        database.exec("INSERT INTO countries VALUES (NULL, 'Sans code')"),
      ).toThrow(/NOT NULL constraint failed/);
      expect(() =>
        database.exec('INSERT INTO genres VALUES (35, NULL)'),
      ).toThrow(/NOT NULL constraint failed/);
      expect(() =>
        database.exec("INSERT INTO countries VALUES ('US', NULL)"),
      ).toThrow(/NOT NULL constraint failed/);
      expect(() =>
        database.exec('INSERT INTO movie_genres VALUES (1, 999)'),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(() =>
        database.exec('INSERT INTO movie_genres VALUES (999, 18)'),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(() =>
        database.exec("INSERT INTO production_countries VALUES (1, 'XX')"),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(() =>
        database.exec("INSERT INTO production_countries VALUES (999, 'FR')"),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(database.prepare('SELECT * FROM movie_genres').all()).toEqual([
        { movie_id: 1, genre_id: 18 },
      ]);
      expect(() =>
        database.exec("INSERT INTO genres VALUES (18, 'Autre')"),
      ).toThrow(/UNIQUE constraint failed/);
      expect(() =>
        database.exec("INSERT INTO countries VALUES ('FR', 'Autre')"),
      ).toThrow(/UNIQUE constraint failed/);
      expect(() => database.exec('DELETE FROM genres WHERE id = 18')).toThrow(
        /FOREIGN KEY constraint failed/,
      );
      expect(() =>
        database.exec("DELETE FROM countries WHERE code = 'FR'"),
      ).toThrow(/FOREIGN KEY constraint failed/);
      database.exec('DELETE FROM movies WHERE id = 1');
      expect(database.prepare('SELECT * FROM movie_genres').all()).toEqual([]);
      expect(
        database.prepare('SELECT * FROM production_countries').all(),
      ).toEqual([]);
      expect(database.prepare('SELECT * FROM genres').all()).toEqual([
        { id: 18, name: 'Drame' },
      ]);
      expect(database.prepare('SELECT * FROM countries').all()).toEqual([
        { code: 'FR', name: 'France' },
      ]);
      expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      expect(database.prepare('PRAGMA integrity_check').get()).toEqual({
        integrity_check: 'ok',
      });
    } finally {
      database.close();
    }
  });

  it('annule les tables déjà créées lorsque la suite de l’initialisation échoue', () => {
    const databasePath = join(temporaryDirectory(), 'partial.sqlite');
    const existing = new DatabaseSync(databasePath);
    existing.exec('CREATE TABLE movie_genres (placeholder INTEGER)');
    existing.close();
    expect(() => getDatabase(databasePath)).toThrow(/no such column: genre_id/);
    const database = new DatabaseSync(databasePath);
    try {
      expect(
        database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all(),
      ).toEqual([{ name: 'movie_genres' }]);
      expect(
        database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
          .all(),
      ).toEqual([]);
    } finally {
      database.close();
    }
  });
});
