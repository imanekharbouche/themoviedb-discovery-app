import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  deleteUnusedGenres,
  getGenreById,
  getGenres,
  upsertGenres,
} from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('genre-repository', () => {
  it('reads, inserts, updates, and orders genres from any iterable', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      expect(getGenreById(database, 18)).toBeUndefined();
      expect(getGenres(database)).toEqual([]);

      upsertGenres(database, new Set([{ id: 35, name: 'Comedy' }]));
      upsertGenres(database, [
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedie' },
        { id: 35, name: 'Comedy' },
      ]);

      expect(getGenreById(database, 18)).toEqual({ id: 18, name: 'Drama' });
      expect(getGenres(database)).toEqual([
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedy' },
      ]);
    } finally {
      database.close();
    }
  });

  it('leaves genres unchanged for an empty iterable and rejects missing names', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertGenres(database, []);
      expect(() => upsertGenres(database, [{ id: 18 } as never])).toThrow();
    } finally {
      database.close();
    }
  });

  it('rolls back every genre when a later row violates the schema', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      expect(() =>
        upsertGenres(database, [
          { id: 18, name: 'Drama' },
          { id: 35, name: null as never },
        ]),
      ).toThrow(/NOT NULL constraint failed/);

      expect(getGenres(database)).toEqual([]);
      expect(
        database.prepare('SELECT COUNT(*) AS count FROM genres').get(),
      ).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it('deletes only genres without a movie association', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertGenres(database, [
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedy' },
      ]);
      database
        .prepare(
          `INSERT INTO movies (
            id, title, original_title, original_language, overview,
            collected_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(1, 'Movie', 'Movie', 'en', '', '2026-01-01T00:00:00Z');
      database
        .prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
        .run(1, 18);

      expect(deleteUnusedGenres(database)).toBe(1);
      expect(getGenres(database)).toEqual([{ id: 18, name: 'Drama' }]);
    } finally {
      database.close();
    }
  });

  it('rolls back cleanup when the association table cannot be queried', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    try {
      upsertGenres(database, [{ id: 18, name: 'Drama' }]);
      database.exec('DROP TABLE movie_genres');

      expect(() => deleteUnusedGenres(database)).toThrow(/no such table/);
      expect(getGenres(database)).toEqual([{ id: 18, name: 'Drama' }]);
    } finally {
      database.close();
    }
  });
});
