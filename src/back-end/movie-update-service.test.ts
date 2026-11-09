import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from './database/schema.ts';
import {
  createMovieUpdateApi,
  updateMoviesFromApi,
  type MovieUpdateApi,
} from './movie-update-service.ts';
import type { Movie, MovieDetails } from './types/MoviesTypes.ts';

const movie: Movie = {
  backdrop_path: null,
  genre_ids: [18],
  id: 1,
  original_language: 'en',
  original_title: 'Movie',
  overview: 'Overview',
  popularity: 1,
  poster_path: null,
  release_date: '2020-01-01',
  title: 'Movie',
  vote_average: 7,
  vote_count: 10,
};

const details: MovieDetails = {
  ...movie,
  genres: [{ id: 18, name: 'Drama' }],
  production_countries: [{ iso_3166_1: 'FR', name: 'France' }],
  tagline: null,
};

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  initializeSchema(database);
  return database;
}

function createApi(
  movies: Movie[] = [movie],
  movieDetails: MovieDetails[] = [details],
): MovieUpdateApi {
  return {
    getMovies: vi.fn().mockResolvedValue(movies),
    getMovieDetails: vi
      .fn()
      .mockImplementation((id: number) =>
        Promise.resolve(movieDetails.find((item) => item.id === id)),
      ),
  };
}

describe('movie-update-service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates movies, genres, countries, and associations from the APIs', async () => {
    const database = createDatabase();
    try {
      const api = createApi();

      await updateMoviesFromApi(database, api);
      await updateMoviesFromApi(database, api);

      expect(database.prepare('SELECT id, name FROM genres').all()).toEqual([
        { id: 18, name: 'Drama' },
      ]);
      expect(
        database.prepare('SELECT code, name FROM countries').all(),
      ).toEqual([{ code: 'FR', name: 'France' }]);
      expect(
        database.prepare('SELECT movie_id, genre_id FROM movie_genres').all(),
      ).toEqual([{ movie_id: 1, genre_id: 18 }]);
      expect(
        database
          .prepare('SELECT movie_id, country_code FROM production_countries')
          .all(),
      ).toEqual([{ movie_id: 1, country_code: 'FR' }]);

      const updatedMovie = {
        ...movie,
        genre_ids: [35],
        title: 'Updated movie',
      };
      const updatedDetails = {
        ...details,
        title: 'Updated movie',
        genres: [{ id: 35, name: 'Comedy' }],
        production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      };
      await updateMoviesFromApi(
        database,
        createApi([updatedMovie], [updatedDetails]),
      );

      expect(database.prepare('SELECT title FROM movies').all()).toEqual([
        { title: 'Updated movie' },
      ]);
      expect(database.prepare('SELECT id, name FROM genres').all()).toEqual([
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedy' },
      ]);
      expect(
        database.prepare('SELECT movie_id, genre_id FROM movie_genres').all(),
      ).toEqual([{ movie_id: 1, genre_id: 35 }]);
      expect(
        database
          .prepare('SELECT movie_id, country_code FROM production_countries')
          .all(),
      ).toEqual([{ movie_id: 1, country_code: 'US' }]);
    } finally {
      database.close();
    }
  });

  it('keeps catalogues unchanged when the API returns no movies', async () => {
    const database = createDatabase();
    try {
      await updateMoviesFromApi(database, createApi([]));
      expect(database.prepare('SELECT * FROM movies').all()).toEqual([]);
      expect(database.prepare('SELECT * FROM genres').all()).toEqual([]);
      expect(database.prepare('SELECT * FROM countries').all()).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('does not write when a details request fails', async () => {
    const database = createDatabase();
    try {
      const api = createApi();
      vi.mocked(api.getMovieDetails).mockRejectedValueOnce(
        new Error('API unavailable'),
      );

      await expect(updateMoviesFromApi(database, api)).rejects.toThrow(
        'API unavailable',
      );
      expect(database.prepare('SELECT * FROM movies').all()).toEqual([]);
      expect(database.prepare('SELECT * FROM genres').all()).toEqual([]);
    } finally {
      database.close();
    }
  });

  it('raises an error for an unsuccessful update API response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createMovieUpdateApi().getMovies()).rejects.toThrow(
      'status 503',
    );
  });

  it('fetches movies and details from the existing API routes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ results: [movie] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(details),
      });
    vi.stubGlobal('fetch', fetchMock);
    const api = createMovieUpdateApi('http://api.test');

    await expect(api.getMovies()).resolves.toEqual([movie]);
    await expect(api.getMovieDetails(movie.id)).resolves.toEqual(details);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://api.test/api/movies/popular',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://api.test/api/movies/1',
    );
  });

  it('rolls back production country associations when association storage fails', async () => {
    const database = createDatabase();
    database.exec(`
      CREATE TRIGGER reject_production_country
      BEFORE INSERT ON production_countries
      BEGIN
        SELECT RAISE(ABORT, 'association failed');
      END
    `);

    try {
      await expect(updateMoviesFromApi(database, createApi())).rejects.toThrow(
        'association failed',
      );
      expect(
        database.prepare('SELECT * FROM production_countries').all(),
      ).toEqual([]);
    } finally {
      database.close();
    }
  });
});
