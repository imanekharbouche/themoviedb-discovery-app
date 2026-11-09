import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { initializeSchema } from './database/schema.ts';
import { importMoviesFromCsv } from './movie-csv-import.ts';

const csv = `id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries
1,Movie,Movie,en,,2020-01-01,10,7,100,/poster,/backdrop,120,1000,2000,"[18]","[{""iso_3166_1"":""FR"",""name"":""France""}]"
`;

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  initializeSchema(database);
  database
    .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
    .run(18, 'Drama');
  return database;
}

describe('movie-csv-import', () => {
  it('inserts, updates, and imports repeatedly without duplicates', () => {
    const database = createDatabase();
    try {
      expect(importMoviesFromCsv(database, csv)).toBe(1);
      expect(importMoviesFromCsv(database, csv)).toBe(1);

      expect(
        database.prepare('SELECT COUNT(*) AS count FROM movies').get(),
      ).toEqual({
        count: 1,
      });
      expect(
        database
          .prepare('SELECT runtime_minutes, budget, revenue FROM movies')
          .all(),
      ).toEqual([{ runtime_minutes: 120, budget: 1000, revenue: 2000 }]);
      expect(database.prepare('SELECT * FROM movie_genres').all()).toEqual([
        { movie_id: 1, genre_id: 18 },
      ]);
      expect(
        database.prepare('SELECT * FROM production_countries').all(),
      ).toEqual([{ movie_id: 1, country_code: 'FR' }]);

      const updated = csv.replace('Movie,Movie', 'Updated,Updated');
      importMoviesFromCsv(database, updated);
      expect(database.prepare('SELECT title FROM movies').all()).toEqual([
        { title: 'Updated' },
      ]);
    } finally {
      database.close();
    }
  });

  it('keeps existing optional values when an update omits them', () => {
    const database = createDatabase();
    try {
      importMoviesFromCsv(database, csv);
      const partial = csv.replace(',120,1000,2000,', ',,, ,');
      importMoviesFromCsv(database, partial);
      expect(
        database
          .prepare('SELECT runtime_minutes, budget, revenue FROM movies')
          .all(),
      ).toEqual([{ runtime_minutes: 120, budget: 1000, revenue: 2000 }]);
    } finally {
      database.close();
    }
  });

  it('rolls back countries, movies, and associations when a genre is unknown', () => {
    const database = createDatabase();
    try {
      expect(() =>
        importMoviesFromCsv(database, csv.replace('[18]', '[999]')),
      ).toThrow(/FOREIGN KEY constraint failed/);
      expect(database.prepare('SELECT * FROM movies').all()).toEqual([]);
      expect(database.prepare('SELECT * FROM countries').all()).toEqual([]);
      expect(
        database.prepare('SELECT * FROM production_countries').all(),
      ).toEqual([]);
    } finally {
      database.close();
    }
  });
});
