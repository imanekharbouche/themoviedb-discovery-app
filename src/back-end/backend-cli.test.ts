import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const readFileSyncMock = vi.fn();
const importMoviesFromCsvMock = vi.fn(() => 2);
const getDatabaseMock = vi.fn(() => ({
  close: closeMock,
}));

vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));

vi.mock('node:fs', () => ({
  readFileSync: readFileSyncMock,
}));

vi.mock('./movie-csv-import.ts', () => ({
  importMoviesFromCsv: importMoviesFromCsvMock,
}));

/**
 * Executes the backend CLI with the specified command-line arguments
 * @param args The command-line arguments to pass to the CLI
 */
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

    it('imports movies from a CSV and closes the database', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      readFileSyncMock.mockReturnValue('csv content');
      try {
        await runCliWithArgs(['import-movies', 'data/movies.csv']);

        expect(readFileSyncMock).toHaveBeenCalledWith(
          'data/movies.csv',
          'utf8',
        );
        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(importMoviesFromCsvMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
          'csv content',
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `2 movies imported into ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });
  });
});
