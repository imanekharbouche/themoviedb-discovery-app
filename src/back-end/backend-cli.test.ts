import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const getDatabaseMock = vi.fn(() => ({
  close: closeMock,
}));

vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));

async function runCliWithArgs(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

describe('backend-cli.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('create-database', () => {
    it('uses the default database path when the subcommand has no path option', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database']);

        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('uses the path passed in --path', async () => {
      const customDatabasePath = './data/custom-movies.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database', '--path', customDatabasePath]);

        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(customDatabasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });
  });
});

// Le processus enfant exécute le vrai CLI, sans reprendre les mocks de Vitest.
describe('create-database avec SQLite réel', () => {
  const cliPath = resolve('src/back-end/backend-cli.ts');

  it('crée la base par défaut, conserve les données et accepte un chemin personnalisé', () => {
    const directory = mkdtempSync(join(tmpdir(), 'tmdb-cli-'));
    try {
      execFileSync(process.execPath, [cliPath, 'create-database'], {
        cwd: directory,
      });
      const databasePath = join(directory, 'data', 'movies.sqlite');
      const first = new DatabaseSync(databasePath);
      try {
        first.exec("INSERT INTO genres VALUES (18, 'Drame')");
      } finally {
        first.close();
      }
      execFileSync(process.execPath, [
        cliPath,
        'create-database',
        '--path',
        databasePath,
      ]);
      const second = new DatabaseSync(databasePath);
      try {
        expect(second.prepare('SELECT * FROM genres').all()).toEqual([
          { id: 18, name: 'Drame' },
        ]);
        expect(second.prepare('PRAGMA integrity_check').get()).toEqual({
          integrity_check: 'ok',
        });
      } finally {
        second.close();
      }
      const customPath = join(directory, 'nested', 'custom.sqlite');
      execFileSync(process.execPath, [
        cliPath,
        'create-database',
        '--path',
        customPath,
      ]);
      const custom = new DatabaseSync(customPath);
      try {
        expect(
          custom
            .prepare(
              "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
            )
            .get(),
        ).toEqual({ count: 5 });
      } finally {
        custom.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('signale un chemin invalide et une option incomplète par un code non nul', () => {
    const directory = mkdtempSync(join(tmpdir(), 'tmdb-cli-error-'));
    try {
      const invalid = spawnSync(
        process.execPath,
        [cliPath, 'create-database', '--path', directory],
        { encoding: 'utf8' },
      );
      expect(invalid.status).not.toBe(0);
      expect(invalid.stderr).toMatch(/unable to open database/);
      const missing = spawnSync(
        process.execPath,
        [cliPath, 'create-database', '--path'],
        { encoding: 'utf8' },
      );
      expect(missing.status).not.toBe(0);
      expect(missing.stderr).toMatch(/argument missing/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
