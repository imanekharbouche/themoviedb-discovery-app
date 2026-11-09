import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from './database/country-repository.ts';
import { upsertGenres } from './database/genre-repository.ts';
import { upsertMovies } from './database/movie-repository.ts';
import type {
  Movie,
  MovieDetails,
  MoviesApiResponse,
  Country,
} from './types/MoviesTypes.ts';

export type MovieUpdateApi = {
  getMovies: () => Promise<Movie[]>;
  getMovieDetails: (id: number) => Promise<MovieDetails>;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Movie update API request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as T;
}

export function createMovieUpdateApi(
  baseUrl = 'http://localhost:3000',
): MovieUpdateApi {
  return {
    async getMovies() {
      const data = await getJson<MoviesApiResponse>(
        `${baseUrl}/api/movies/popular`,
      );
      return data.results;
    },
    getMovieDetails(id) {
      return getJson<MovieDetails>(`${baseUrl}/api/movies/${id}`);
    },
  };
}

function uniqueGenres(details: MovieDetails[]) {
  const genres = new Map<number, { id: number; name: string }>();
  for (const detail of details) {
    for (const genre of detail.genres) {
      genres.set(genre.id, genre);
    }
  }
  return genres.values();
}

function uniqueCountries(details: MovieDetails[]): Country[] {
  const countries = new Map<string, Country>();
  for (const detail of details) {
    for (const country of detail.production_countries) {
      countries.set(country.iso_3166_1, {
        code: country.iso_3166_1,
        name: country.name,
      });
    }
  }
  return [...countries.values()];
}

function updateProductionCountries(
  database: DatabaseSync,
  movies: Array<{
    id: number;
    production_countries: MovieDetails['production_countries'];
  }>,
): void {
  database.exec('BEGIN');
  try {
    const deleteCountries = database.prepare(
      'DELETE FROM production_countries WHERE movie_id = ?',
    );
    const insertCountry = database.prepare(
      'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
    );

    for (const movie of movies) {
      deleteCountries.run(movie.id);
      for (const country of new Set(
        movie.production_countries.map(({ iso_3166_1 }) => iso_3166_1),
      )) {
        insertCountry.run(movie.id, country);
      }
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export async function updateMoviesFromApi(
  database: DatabaseSync,
  api: MovieUpdateApi,
): Promise<void> {
  const movies = await api.getMovies();
  if (movies.length === 0) return;

  const details = await Promise.all(
    movies.map(({ id }) => api.getMovieDetails(id)),
  );
  upsertGenres(database, uniqueGenres(details));
  upsertCountries(database, uniqueCountries(details));
  upsertMovies(database, movies);
  updateProductionCountries(database, details);
}
