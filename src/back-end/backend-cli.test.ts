import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const readFileSyncMock = vi.fn();
const importMoviesFromCsvMock = vi.fn(() => 2);
const parseCountriesCsvMock = vi.fn(() => [{ code: 'FR', name: 'France' }]);
const upsertCountriesMock = vi.fn();
const deleteUnusedCountriesMock = vi.fn(() => 1);
const parseGenresCsvMock = vi.fn(() => [{ id: 18, name: 'Drama' }]);
const upsertGenresMock = vi.fn();
const deleteUnusedGenresMock = vi.fn(() => 1);
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

vi.mock('./database/country-csv.ts', () => ({
  parseCountriesCsv: parseCountriesCsvMock,
}));

vi.mock('./database/country-repository.ts', () => ({
  upsertCountries: upsertCountriesMock,
  deleteUnusedCountries: deleteUnusedCountriesMock,
}));

vi.mock('./database/genre-csv.ts', () => ({
  parseGenresCsv: parseGenresCsvMock,
}));

vi.mock('./database/genre-repository.ts', () => ({
  upsertGenres: upsertGenresMock,
  deleteUnusedGenres: deleteUnusedGenresMock,
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

    it('does not open SQLite when the movie CSV cannot be read', async () => {
      readFileSyncMock.mockImplementationOnce(() => {
        throw new Error('CSV file not found');
      });

      await expect(
        runCliWithArgs(['import-movies', 'missing.csv']),
      ).rejects.toThrow('CSV file not found');
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });

    it('closes SQLite and propagates an import error', async () => {
      readFileSyncMock.mockReturnValue('csv content');
      importMoviesFromCsvMock.mockImplementationOnce(() => {
        throw new Error('invalid movie data');
      });

      await expect(
        runCliWithArgs(['import-movies', 'movies.csv']),
      ).rejects.toThrow('invalid movie data');
      expect(closeMock).toHaveBeenCalledOnce();
    });

    it('imports countries after validating the CSV and closes the database', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      readFileSyncMock.mockReturnValue('countries csv');
      try {
        await runCliWithArgs(['add-countries', 'data/countries.csv']);

        expect(readFileSyncMock).toHaveBeenCalledWith(
          'data/countries.csv',
          'utf8',
        );
        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(upsertCountriesMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
          [{ code: 'FR', name: 'France' }],
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `1 countries imported into ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('uses the configured path when importing countries', async () => {
      const customDatabasePath = './data/custom-countries.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      readFileSyncMock.mockReturnValue('countries csv');
      try {
        await runCliWithArgs([
          'add-countries',
          'data/countries.csv',
          '--path',
          customDatabasePath,
        ]);

        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      } finally {
        logSpy.mockRestore();
      }
    });

    it('closes SQLite and propagates a country import error', async () => {
      readFileSyncMock.mockReturnValue('countries csv');
      upsertCountriesMock.mockImplementationOnce(() => {
        throw new Error('country import failed');
      });

      await expect(
        runCliWithArgs(['add-countries', 'data/countries.csv']),
      ).rejects.toThrow('country import failed');
      expect(closeMock).toHaveBeenCalledOnce();
    });

    it('cleans unused countries and closes the database', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['clean-countries']);

        expect(deleteUnusedCountriesMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `1 countries removed from ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('cleans unused countries with the configured path', async () => {
      const customDatabasePath = './data/custom-countries.sqlite';

      await runCliWithArgs(['clean-countries', '--path', customDatabasePath]);

      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(deleteUnusedCountriesMock).toHaveBeenCalledWith(
        expect.objectContaining({ close: closeMock }),
      );
    });

    it('does not open SQLite when country CSV validation fails', async () => {
      parseCountriesCsvMock.mockImplementationOnce(() => {
        throw new Error('Invalid countries CSV');
      });

      await expect(
        runCliWithArgs(['add-countries', 'invalid.csv']),
      ).rejects.toThrow('Invalid countries CSV');
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });

    it('imports genres with the configured path and closes the database', async () => {
      const customDatabasePath = './data/custom-genres.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      readFileSyncMock.mockReturnValue('genres csv');
      try {
        await runCliWithArgs([
          'add-genres',
          'data/genres.csv',
          '--path',
          customDatabasePath,
        ]);

        expect(readFileSyncMock).toHaveBeenCalledWith(
          'data/genres.csv',
          'utf8',
        );
        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
        expect(upsertGenresMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
          [{ id: 18, name: 'Drama' }],
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `1 genres imported into ${resolve(customDatabasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('validates genres before opening SQLite', async () => {
      parseGenresCsvMock.mockImplementationOnce(() => {
        throw new Error('Invalid genres CSV');
      });

      await expect(
        runCliWithArgs(['add-genres', 'invalid.csv']),
      ).rejects.toThrow('Invalid genres CSV');
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });

    it('closes SQLite and propagates a genre import error', async () => {
      readFileSyncMock.mockReturnValue('genres csv');
      upsertGenresMock.mockImplementationOnce(() => {
        throw new Error('genre import failed');
      });

      await expect(
        runCliWithArgs(['add-genres', 'data/genres.csv']),
      ).rejects.toThrow('genre import failed');
      expect(closeMock).toHaveBeenCalledOnce();
    });

    it('cleans unused genres and closes the database', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['clean-genres']);

        expect(deleteUnusedGenresMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `1 genres removed from ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('cleans unused genres with the configured path', async () => {
      const customDatabasePath = './data/custom-genres.sqlite';

      await runCliWithArgs(['clean-genres', '--path', customDatabasePath]);

      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(deleteUnusedGenresMock).toHaveBeenCalledWith(
        expect.objectContaining({ close: closeMock }),
      );
    });
  });
});
