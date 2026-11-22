import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const cliPath = resolve('src/back-end/backend-cli.ts');
let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'tmdb-countries-cli-'));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

function runCli(args: string[]): string {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: directory,
    encoding: 'utf8',
  });
}

describe('commandes de pays avec le vrai CLI et SQLite', () => {
  it.each([false, true])(
    'importe, actualise puis nettoie sans perdre les pays associés (chemin personnalisé : %s)',
    (custom) => {
      const databasePath = custom
        ? join(directory, 'custom', 'countries.sqlite')
        : join(directory, 'data', 'movies.sqlite');
      const csvPath = join(directory, 'countries.csv');
      writeFileSync(csvPath, 'code,name\nFR,France\nUS,USA\nUS,United States');
      const before = custom ? ['--path', databasePath] : [];
      expect(runCli([...before, 'add-countries', csvPath])).toContain(
        `3 countries imported into ${databasePath}`,
      );
      const first = new DatabaseSync(databasePath);
      try {
        expect(
          first.prepare('SELECT * FROM countries ORDER BY code').all(),
        ).toEqual([
          { code: 'FR', name: 'France' },
          { code: 'US', name: 'United States' },
        ]);
        first.exec(`INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
        VALUES (1, 'Film', 'Film', 'fr', '', '2026-01-01');
        INSERT INTO production_countries VALUES (1, 'FR');`);
      } finally {
        first.close();
      }
      writeFileSync(csvPath, 'code,name\nFR,République française');
      const after = custom ? ['--path', databasePath] : [];
      expect(runCli(['add-countries', csvPath, ...after])).toContain(
        `1 countries imported into ${databasePath}`,
      );
      expect(runCli(['clean-countries', ...after])).toContain(
        `1 countries removed from ${databasePath}`,
      );
      const second = new DatabaseSync(databasePath);
      try {
        expect(second.prepare('SELECT * FROM countries').all()).toEqual([
          { code: 'FR', name: 'République française' },
        ]);
        expect(
          second.prepare('SELECT * FROM production_countries').all(),
        ).toEqual([{ movie_id: 1, country_code: 'FR' }]);
        expect(second.prepare('PRAGMA integrity_check').get()).toEqual({
          integrity_check: 'ok',
        });
      } finally {
        second.close();
      }
      expect(runCli([...before, 'clean-countries'])).toContain(
        '0 countries removed',
      );
    },
  );

  it('rejette tout le fichier invalide avant de créer une base, même après une ligne valide', () => {
    const csvPath = join(directory, 'invalid.csv');
    const databasePath = join(directory, 'uncreated', 'invalid.sqlite');
    writeFileSync(csvPath, 'code,name\nFR,France\nUS,');
    const result = spawnSync(
      process.execPath,
      [cliPath, '--path', databasePath, 'add-countries', csvPath],
      { cwd: directory, encoding: 'utf8' },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/empty name/);
    expect(existsSync(databasePath)).toBe(false);
    expect(existsSync(join(directory, 'uncreated'))).toBe(false);
  });
});
