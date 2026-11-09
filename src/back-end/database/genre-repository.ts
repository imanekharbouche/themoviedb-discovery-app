import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes.ts';

export function getGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  return database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id) as Genre | undefined;
}

export function getGenres(database: DatabaseSync): Genre[] {
  return database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all() as Genre[];
}

export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  const statement = database.prepare(`
    INSERT INTO genres (id, name) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `);

  const savepoint = 'upsert_genres';
  const hasOuterTransaction = database.isTransaction;
  if (hasOuterTransaction) database.exec(`SAVEPOINT ${savepoint}`);
  else database.exec('BEGIN');
  try {
    for (const genre of genres) {
      statement.run(genre.id, genre.name);
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

export function deleteUnusedGenres(database: DatabaseSync): number {
  database.exec('BEGIN');
  try {
    const result = database
      .prepare(`
        DELETE FROM genres
        WHERE NOT EXISTS (
          SELECT 1
          FROM movie_genres
          WHERE movie_genres.genre_id = genres.id
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
