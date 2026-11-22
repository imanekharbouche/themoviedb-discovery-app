import type { DatabaseSync } from 'node:sqlite';
import type { Movie } from '../types/MoviesTypes.ts';

type MovieRow = Omit<Movie, 'genre_ids'>;

export type MovieWithDetails = Movie & {
  runtime_minutes?: number;
  budget?: number;
  revenue?: number;
};

function readMovie(database: DatabaseSync, row: MovieRow): Movie {
  const genreRows = database
    .prepare(
      'SELECT genre_id FROM movie_genres WHERE movie_id = ? ORDER BY genre_id',
    )
    .all(row.id) as Array<{ genre_id: number }>;

  return {
    ...row,
    genre_ids: genreRows.map(({ genre_id }) => genre_id),
  };
}

export function getMovieById(
  database: DatabaseSync,
  id: number,
): Movie | undefined {
  const row = database
    .prepare(`
      SELECT
        id, title, original_title, original_language, overview,
        release_date, popularity, vote_average, vote_count,
        poster_path, backdrop_path
      FROM movies
      WHERE id = ?
    `)
    .get(id) as MovieRow | undefined;

  return row ? readMovie(database, row) : undefined;
}

export function getMovies(database: DatabaseSync): Movie[] {
  const rows = database
    .prepare(`
      SELECT
        id, title, original_title, original_language, overview,
        release_date, popularity, vote_average, vote_count,
        poster_path, backdrop_path
      FROM movies
      ORDER BY id ASC
    `)
    .all() as MovieRow[];

  return rows.map((row) => readMovie(database, row));
}

export function upsertMovies(
  database: DatabaseSync,
  movies: Iterable<MovieWithDetails>,
): void {
  const statement = database.prepare(`
    INSERT INTO movies (
      id, title, original_title, original_language, overview,
      release_date, popularity, vote_average, vote_count,
      poster_path, backdrop_path, runtime_minutes, budget, revenue, collected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      original_title = excluded.original_title,
      original_language = excluded.original_language,
      overview = excluded.overview,
      release_date = excluded.release_date,
      popularity = excluded.popularity,
      vote_average = excluded.vote_average,
      vote_count = excluded.vote_count,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      runtime_minutes = COALESCE(excluded.runtime_minutes, movies.runtime_minutes),
      budget = COALESCE(excluded.budget, movies.budget),
      revenue = COALESCE(excluded.revenue, movies.revenue),
      collected_at = excluded.collected_at
  `);
  const deleteGenres = database.prepare(
    'DELETE FROM movie_genres WHERE movie_id = ?',
  );
  const insertGenre = database.prepare(
    'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
  );

  const savepoint = 'upsert_movies';
  const hasOuterTransaction = database.isTransaction;
  if (hasOuterTransaction) database.exec(`SAVEPOINT ${savepoint}`);
  else database.exec('BEGIN');
  try {
    for (const movie of movies) {
      statement.run(
        movie.id,
        movie.title,
        movie.original_title,
        movie.original_language,
        movie.overview,
        movie.release_date,
        movie.popularity,
        movie.vote_average,
        movie.vote_count,
        movie.poster_path,
        movie.backdrop_path,
        movie.runtime_minutes ?? null,
        movie.budget ?? null,
        movie.revenue ?? null,
      );
      deleteGenres.run(movie.id);
      for (const genreId of new Set(movie.genre_ids)) {
        insertGenre.run(movie.id, genreId);
      }
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
