import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

// Chemin utilisé par défaut par le CLI.
export const DEFAULT_DATABASE_PATH = resolve('data/movies.sqlite');

/** Ouvre la base et initialise le schéma dans une transaction. */
export function getDatabase(
  databasePath = DEFAULT_DATABASE_PATH,
  force = false,
): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);

  database.exec('PRAGMA foreign_keys = ON;');

  database.exec('BEGIN TRANSACTION;');
  try {
    if (force) {
      database.exec(`
        DROP TABLE IF EXISTS movie_genres;
        DROP TABLE IF EXISTS production_countries;
        DROP TABLE IF EXISTS movies;
        DROP TABLE IF EXISTS genres;
        DROP TABLE IF EXISTS countries;
      `);
    }
    initializeSchema(database);
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    database.close();
    throw error;
  }

  return database;
}

/** Crée les tables et index sans effacer les données existantes. */
export function initializeSchema(database: DatabaseSync): void {
  initializeMoviesSchema(database);
  initializeGenresSchema(database);
  initializeCountriesSchema(database);
}

function initializeMoviesSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      original_title TEXT NOT NULL,
      original_language TEXT NOT NULL,
      overview TEXT NOT NULL,
      release_date TEXT CHECK (
        release_date IS NULL
        OR (
          strftime('%Y-%m-%d', release_date) IS NOT NULL
          AND strftime('%Y-%m-%d', release_date) = release_date
        )
      ),
      release_year INTEGER GENERATED ALWAYS AS (CAST(strftime('%Y', release_date) AS INTEGER)) STORED,
      popularity REAL,
      vote_average REAL,
      vote_count INTEGER,
      poster_path TEXT,
      backdrop_path TEXT,
      runtime_minutes INTEGER CHECK(runtime_minutes IS NULL OR runtime_minutes > 0),
      budget INTEGER CHECK(budget IS NULL OR budget > 0),
      revenue INTEGER CHECK(revenue IS NULL OR revenue > 0),
      collected_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS movies_release_year ON movies(release_year);
  `);
}

export function initializeGenresSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id),
      PRIMARY KEY (movie_id, genre_id)
    );
    CREATE INDEX IF NOT EXISTS movie_genres_genre_id ON movie_genres(genre_id);
  `);
}

function initializeCountriesSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_countries (
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      country_code TEXT NOT NULL REFERENCES countries(code),
      PRIMARY KEY (movie_id, country_code)
    );
    CREATE INDEX IF NOT EXISTS production_countries_country_code ON production_countries(country_code);
  `);
}
