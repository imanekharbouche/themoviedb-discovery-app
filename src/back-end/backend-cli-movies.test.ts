import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  database: { close: vi.fn() },
  readFile: vi.fn(),
  open: vi.fn(),
  importMovies: vi.fn(),
}));
const defaultPath = '/tmp/movies-default.sqlite';

vi.mock('node:fs', () => ({ readFileSync: mocks.readFile }));
vi.mock('./movie-csv-import.ts', () => ({
  importMoviesFromCsv: mocks.importMovies,
}));
vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH: '/tmp/movies-default.sqlite',
  getDatabase: mocks.open,
}));

async function runCli(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
  mocks.readFile.mockReturnValue('csv content');
  mocks.open.mockReturnValue(mocks.database);
  mocks.importMovies.mockReturnValue(2);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const pathCases = [
  { label: 'par défaut', before: [], after: [], path: defaultPath },
  {
    label: 'après la commande',
    before: [],
    after: ['--path', './custom.sqlite'],
    path: './custom.sqlite',
  },
  {
    label: 'avant la commande',
    before: ['--path', './custom.sqlite'],
    after: [],
    path: './custom.sqlite',
  },
];

describe('commande import-movies du CLI', () => {
  it.each(pathCases)(
    'importe les films depuis un CSV et ferme la base : $label',
    async ({ before, after, path }) => {
      await runCli([...before, 'import-movies', 'data/movies.csv', ...after]);
      expect(mocks.readFile).toHaveBeenCalledExactlyOnceWith(
        'data/movies.csv',
        'utf8',
      );
      expect(mocks.open).toHaveBeenCalledExactlyOnceWith(path);
      expect(mocks.importMovies).toHaveBeenCalledExactlyOnceWith(
        mocks.database,
        'csv content',
      );
      expect(mocks.database.close).toHaveBeenCalledOnce();
      expect(console.log).toHaveBeenCalledExactlyOnceWith(
        `2 movies imported into ${resolve(path)}`,
      );
    },
  );

  it('ne crée aucune base si la lecture du CSV des films échoue', async () => {
    mocks.readFile.mockImplementationOnce(() => {
      throw new Error('CSV file not found');
    });
    await expect(runCli(['import-movies', 'missing.csv'])).rejects.toThrow(
      'CSV file not found',
    );
    expect(mocks.open).not.toHaveBeenCalled();
    expect(mocks.importMovies).not.toHaveBeenCalled();
  });

  it('ferme SQLite et propage une erreur pendant l’import des films', async () => {
    mocks.importMovies.mockImplementationOnce(() => {
      throw new Error('invalid movie data');
    });
    await expect(runCli(['import-movies', 'movies.csv'])).rejects.toThrow(
      'invalid movie data',
    );
    expect(mocks.database.close).toHaveBeenCalledOnce();
    expect(console.log).not.toHaveBeenCalled();
  });
});
