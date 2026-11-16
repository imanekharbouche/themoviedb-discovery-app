import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genre-csv.ts';
import {
  deleteUnusedGenres,
  getGenres,
  upsertGenres,
} from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('import CSV et nettoyage SQLite des genres', () => {
  let database: DatabaseSync;
  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    initializeSchema(database);
  });
  afterEach(() => database.close());

  it('insère et actualise les valeurs CSV sans doublon', () => {
    upsertGenres(database, parseGenresCsv('id,name\n18,Drama\n35,Comedy'));
    upsertGenres(database, parseGenresCsv('NAME,ID\nDrame,18\nDramatique,18'));
    expect(database.prepare('SELECT * FROM genres ORDER BY id').all()).toEqual([
      { id: 18, name: 'Dramatique' },
      { id: 35, name: 'Comedy' },
    ]);
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM genres').get(),
    ).toEqual({ count: 2 });
  });

  it('annule un import CSV après une première écriture si SQLite rejette la suite', () => {
    upsertGenres(database, [{ id: 18, name: 'Drame' }]);
    database.exec(`CREATE TRIGGER reject_genre BEFORE INSERT ON genres
      WHEN NEW.id = 35 BEGIN SELECT RAISE(FAIL, 'import rejected'); END`);
    const genres = parseGenresCsv(
      'id,name\n18,Nom temporaire\n28,Action\n35,Comedy',
    );
    expect(() => upsertGenres(database, genres)).toThrow(/import rejected/);
    expect(database.prepare('SELECT * FROM genres').all()).toEqual([
      { id: 18, name: 'Drame' },
    ]);
    database.exec('DROP TRIGGER reject_genre');
    upsertGenres(database, [{ id: 35, name: 'Comedy' }]);
    expect(getGenres(database)).toHaveLength(2);
  });

  it('supprime uniquement les genres sans film et conserve les associations', () => {
    upsertGenres(
      database,
      parseGenresCsv('id,name\n18,Drame\n35,Comedy\n28,Action'),
    );
    database.exec(`INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
      VALUES (1, 'Film', 'Film', 'fr', '', '2026-01-01');
      INSERT INTO movie_genres VALUES (1, 18);`);
    expect(deleteUnusedGenres(database)).toBe(2);
    expect(database.prepare('SELECT * FROM genres').all()).toEqual([
      { id: 18, name: 'Drame' },
    ]);
    expect(database.prepare('SELECT * FROM movie_genres').all()).toEqual([
      { movie_id: 1, genre_id: 18 },
    ]);
    expect(deleteUnusedGenres(database)).toBe(0);
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('restaure toutes les suppressions après une erreur partielle puis permet de recommencer', () => {
    upsertGenres(database, [
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comedy' },
    ]);
    // RAISE(FAIL) laisse les écritures précédentes du DELETE en cours dans la transaction.
    // Le rollback de la fonction doit annuler les suppressions et les effets du trigger.
    database.exec(`CREATE TABLE cleanup_log (genre_id INTEGER);
      CREATE TRIGGER fail_cleanup AFTER DELETE ON genres BEGIN
        INSERT INTO cleanup_log VALUES (OLD.id);
        SELECT CASE WHEN OLD.id = 35 THEN RAISE(FAIL, 'cleanup failed') END;
      END;`);
    expect(() => deleteUnusedGenres(database)).toThrow(/cleanup failed/);
    expect(database.prepare('SELECT * FROM genres ORDER BY id').all()).toEqual([
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comedy' },
    ]);
    expect(database.prepare('SELECT * FROM cleanup_log').all()).toEqual([]);
    database.exec('DROP TRIGGER fail_cleanup');
    expect(deleteUnusedGenres(database)).toBe(2);
    expect(getGenres(database)).toEqual([]);
    expect(database.prepare('PRAGMA integrity_check').get()).toEqual({
      integrity_check: 'ok',
    });
  });
});
