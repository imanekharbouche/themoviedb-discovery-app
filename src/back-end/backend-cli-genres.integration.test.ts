import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const cliPath = resolve('src/back-end/backend-cli.ts');
let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'tmdb-genres-cli-'));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

function runCli(args: string[]): string {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: directory,
    encoding: 'utf8',
  });
}

describe('commandes de genres avec le vrai CLI et SQLite', () => {
  it.each([false, true])(
    'importe, actualise puis nettoie sans perdre les genres associés (chemin personnalisé : %s)',
    (custom) => {
      const databasePath = custom
        ? join(directory, 'custom', 'genres.sqlite')
        : join(directory, 'data', 'movies.sqlite');
      const csvPath = join(directory, 'genres.csv');
      writeFileSync(csvPath, 'id,name\n18,Drama\n35,Comedy\n18,Drame');
      const before = custom ? ['--path', databasePath] : [];
      expect(runCli([...before, 'add-genres', csvPath])).toContain(
        `3 genres imported into ${databasePath}`,
      );
      const first = new DatabaseSync(databasePath);
      try {
        expect(first.prepare('SELECT * FROM genres ORDER BY id').all()).toEqual(
          [
            { id: 18, name: 'Drame' },
            { id: 35, name: 'Comedy' },
          ],
        );
        first.exec(`INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
        VALUES (1, 'Film', 'Film', 'fr', '', '2026-01-01');
        INSERT INTO movie_genres VALUES (1, 18);`);
      } finally {
        first.close();
      }
      writeFileSync(csvPath, 'id,name\n18,Dramatique');
      const after = custom ? ['--path', databasePath] : [];
      expect(runCli(['add-genres', csvPath, ...after])).toContain(
        `1 genres imported into ${databasePath}`,
      );
      expect(runCli(['clean-genres', ...after])).toContain(
        `1 genres removed from ${databasePath}`,
      );
      const second = new DatabaseSync(databasePath);
      try {
        expect(second.prepare('SELECT * FROM genres').all()).toEqual([
          { id: 18, name: 'Dramatique' },
        ]);
        expect(second.prepare('SELECT * FROM movie_genres').all()).toEqual([
          { movie_id: 1, genre_id: 18 },
        ]);
        expect(second.prepare('PRAGMA integrity_check').get()).toEqual({
          integrity_check: 'ok',
        });
      } finally {
        second.close();
      }
      expect(runCli([...before, 'clean-genres'])).toContain('0 genres removed');
    },
  );

  it('rejette tout le fichier invalide avant de créer une base, même après une ligne valide', () => {
    const csvPath = join(directory, 'invalid.csv');
    const databasePath = join(directory, 'uncreated', 'invalid.sqlite');
    writeFileSync(csvPath, 'id,name\n18,Drama\n35,');
    const result = spawnSync(
      process.execPath,
      [cliPath, '--path', databasePath, 'add-genres', csvPath],
      { cwd: directory, encoding: 'utf8' },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/empty name/);
    expect(existsSync(databasePath)).toBe(false);
    expect(existsSync(join(directory, 'uncreated'))).toBe(false);
  });
});
