import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { getMovieById, getMovies, upsertMovies } from './movie-repository.ts';
import { initializeSchema } from './schema.ts';
import type { Movie } from '../types/MoviesTypes.ts';

const firstMovie: Movie = {
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18, 18],
  id: 2,
  original_language: 'en',
  original_title: 'Second movie',
  overview: 'A second movie',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2020-01-02',
  title: 'Second movie',
  vote_average: 7.2,
  vote_count: 100,
};

const secondMovie: Movie = {
  ...firstMovie,
  genre_ids: [35],
  id: 1,
  original_title: 'First movie',
  title: 'First movie',
};

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  initializeSchema(database);
  database
    .prepare('INSERT INTO genres (id, name) VALUES (?, ?), (?, ?), (?, ?)')
    .run(18, 'Drama', 35, 'Comedy', 99, 'Documentary');
  return database;
}

describe('movie-repository', () => {
  it('finds, lists, inserts, updates, and orders movies from an iterable', () => {
    const database = createDatabase();

    try {
      expect(getMovieById(database, 1)).toBeUndefined();
      expect(getMovies(database)).toEqual([]);

      upsertMovies(database, new Set([firstMovie, secondMovie]));

      expect(getMovieById(database, 2)).toEqual({
        ...firstMovie,
        genre_ids: [18],
      });
      expect(getMovies(database)).toEqual([
        { ...secondMovie, genre_ids: [35] },
        { ...firstMovie, genre_ids: [18] },
      ]);

      upsertMovies(database, [
        { ...firstMovie, title: 'Updated movie', genre_ids: [35, 35] },
      ]);

      expect(getMovieById(database, 2)).toEqual({
        ...firstMovie,
        title: 'Updated movie',
        genre_ids: [35],
      });
      expect(
        database
          .prepare(
            'SELECT COUNT(*) AS count FROM movie_genres WHERE movie_id = ?',
          )
          .get(2),
      ).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it('leaves the database unchanged for an empty iterable', () => {
    const database = createDatabase();

    try {
      upsertMovies(database, [firstMovie]);
      upsertMovies(database, []);
      expect(getMovies(database)).toEqual([{ ...firstMovie, genre_ids: [18] }]);
    } finally {
      database.close();
    }
  });

  it('rolls back all changes and restores existing movies when a movie association is invalid', () => {
    const database = createDatabase();

    try {
      upsertMovies(database, [firstMovie]);

      expect(() =>
        upsertMovies(database, [
          { ...firstMovie, title: 'Temporary title', genre_ids: [99] },
          secondMovie,
          { ...secondMovie, id: 3, genre_ids: [999] },
        ]),
      ).toThrow(/FOREIGN KEY constraint failed/);

      expect(getMovies(database)).toEqual([{ ...firstMovie, genre_ids: [18] }]);
      expect(
        database.prepare('SELECT movie_id, genre_id FROM movie_genres').all(),
      ).toEqual([{ movie_id: 2, genre_id: 18 }]);

      // Une nouvelle écriture doit rester possible après le rollback.
      upsertMovies(database, [secondMovie]);
      expect(getMovies(database)).toHaveLength(2);
    } finally {
      database.close();
    }
  });
});
