import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getGenreById, getGenres, upsertGenres } from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('genre-repository', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('renvoie une liste vide et undefined pour un genre absent', () => {
    expect(getGenres(database)).toEqual([]);
    expect(getGenreById(database, 18)).toBeUndefined();
  });

  it('insère un iterable et trie les genres par identifiant', () => {
    // Sans ORDER BY, ce pragma inverse les résultats : le tri est réellement vérifié.
    database.exec('PRAGMA reverse_unordered_selects = ON');
    upsertGenres(
      database,
      new Set([
        { id: 35, name: 'Comédie' },
        { id: 18, name: 'Drame' },
        { id: 28, name: 'Action' },
      ]),
    );

    expect(getGenres(database)).toEqual([
      { id: 18, name: 'Drame' },
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comédie' },
    ]);
    expect(getGenreById(database, 28)).toEqual({ id: 28, name: 'Action' });
    expect(getGenreById(database, 99)).toBeUndefined();
  });

  it('met à jour les noms sans doublon et conserve les autres genres', () => {
    upsertGenres(database, [
      { id: 18, name: 'Drama' },
      { id: 35, name: 'Comédie' },
    ]);
    upsertGenres(database, [
      { id: 18, name: 'Drame' },
      { id: 18, name: 'Dramatique' },
    ]);

    expect(getGenreById(database, 18)).toEqual({ id: 18, name: 'Dramatique' });
    expect(
      database.prepare('SELECT id, name FROM genres ORDER BY id').all(),
    ).toEqual([
      { id: 18, name: 'Dramatique' },
      { id: 35, name: 'Comédie' },
    ]);
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM genres').get(),
    ).toEqual({ count: 2 });
  });

  it('conserve les données pour un iterable vide et termine sa transaction', () => {
    upsertGenres(database, [{ id: 18, name: 'Drame' }]);
    upsertGenres(database, []);
    expect(getGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
    // Une nouvelle transaction doit rester possible après le lot vide.
    upsertGenres(database, [{ id: 35, name: 'Comédie' }]);
    expect(getGenres(database)).toHaveLength(2);
  });

  it('annule tout le lot si une ligne suivante viole le schéma', () => {
    // Régression issue de la correction historique 28d4e81 : la première ligne est valide.
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
  });

  it('restaure les lignes existantes et permet une écriture après un rollback', () => {
    upsertGenres(database, [{ id: 18, name: 'Drame' }]);
    expect(() =>
      upsertGenres(database, [
        { id: 18, name: 'Nom temporaire' },
        { id: 28, name: 'Action' },
        { id: 35, name: null as never },
      ]),
    ).toThrow(/NOT NULL constraint failed/);

    expect(database.prepare('SELECT id, name FROM genres').all()).toEqual([
      { id: 18, name: 'Drame' },
    ]);
    upsertGenres(database, [{ id: 35, name: 'Comédie' }]);
    expect(getGenres(database)).toEqual([
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comédie' },
    ]);
    expect(database.prepare('PRAGMA integrity_check').get()).toEqual({
      integrity_check: 'ok',
    });
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });
});
