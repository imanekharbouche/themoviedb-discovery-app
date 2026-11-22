import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from './database/country-repository.ts';
import { parseMoviesCsv, type CsvMovie } from './database/movie-csv.ts';
import { upsertMovies } from './database/movie-repository.ts';

function updateProductionCountries(
  database: DatabaseSync,
  movies: CsvMovie[],
): void {
  const deleteCountries = database.prepare(
    'DELETE FROM production_countries WHERE movie_id = ?',
  );
  const insertCountry = database.prepare(
    'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
  );

  for (const movie of movies) {
    deleteCountries.run(movie.id);
    for (const country of new Set(movie.countries.map(({ code }) => code))) {
      insertCountry.run(movie.id, country);
    }
  }
}

export function importMoviesFromCsv(
  database: DatabaseSync,
  csvContent: string,
): number {
  const movies = parseMoviesCsv(csvContent);
  database.exec('BEGIN');
  try {
    upsertCountries(
      database,
      movies.flatMap((movie) => movie.countries),
    );
    upsertMovies(database, movies);
    updateProductionCountries(database, movies);
    database.exec('COMMIT');
    return movies.length;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
