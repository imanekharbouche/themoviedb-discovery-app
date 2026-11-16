import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  database: { close: vi.fn() },
  readFile: vi.fn(),
  parse: vi.fn(),
  open: vi.fn(),
  upsert: vi.fn(),
  clean: vi.fn(),
}));
const defaultPath = '/tmp/movies-default.sqlite';
const genres = [{ id: 18, name: 'Drame' }];

vi.mock('node:fs', () => ({ readFileSync: mocks.readFile }));
vi.mock('./database/genre-csv.ts', () => ({ parseGenresCsv: mocks.parse }));
vi.mock('./database/genre-repository.ts', () => ({
  upsertGenres: mocks.upsert,
  deleteUnusedGenres: mocks.clean,
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
  mocks.readFile.mockReturnValue('id,name\n18,Drame');
  mocks.parse.mockReturnValue(genres);
  mocks.open.mockReturnValue(mocks.database);
  mocks.clean.mockReturnValue(2);
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
  {
    label: 'local prioritaire',
    before: ['--path', './global.sqlite'],
    after: ['--path', './local.sqlite'],
    path: './local.sqlite',
  },
];

describe('commandes de genres du CLI', () => {
  it.each(pathCases)(
    'importe et valide avant ouverture : $label',
    async ({ before, after, path }) => {
      await runCli([...before, 'add-genres', 'genres.csv', ...after]);
      expect(mocks.readFile).toHaveBeenCalledExactlyOnceWith(
        'genres.csv',
        'utf8',
      );
      expect(mocks.parse).toHaveBeenCalledExactlyOnceWith('id,name\n18,Drame');
      expect(mocks.open).toHaveBeenCalledExactlyOnceWith(path);
      expect(mocks.parse.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.open.mock.invocationCallOrder[0],
      );
      expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(
        mocks.database,
        genres,
      );
      expect(mocks.database.close).toHaveBeenCalledOnce();
      expect(console.log).toHaveBeenCalledExactlyOnceWith(
        `1 genres imported into ${resolve(path)}`,
      );
    },
  );

  it.each(pathCases)(
    'nettoie et ferme la base : $label',
    async ({ before, after, path }) => {
      await runCli([...before, 'clean-genres', ...after]);
      expect(mocks.open).toHaveBeenCalledExactlyOnceWith(path);
      expect(mocks.clean).toHaveBeenCalledExactlyOnceWith(mocks.database);
      expect(mocks.database.close).toHaveBeenCalledOnce();
      expect(mocks.readFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledExactlyOnceWith(
        `2 genres removed from ${resolve(path)}`,
      );
    },
  );

  it('ne crée aucune base si la lecture du CSV échoue', async () => {
    mocks.readFile.mockImplementationOnce(() => {
      throw new Error('CSV introuvable');
    });
    await expect(runCli(['add-genres', 'missing.csv'])).rejects.toThrow(
      'CSV introuvable',
    );
    expect(mocks.parse).not.toHaveBeenCalled();
    expect(mocks.open).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('ne crée aucune base si la validation du CSV échoue', async () => {
    mocks.parse.mockImplementationOnce(() => {
      throw new Error('Invalid genres CSV');
    });
    await expect(runCli(['add-genres', 'invalid.csv'])).rejects.toThrow(
      'Invalid genres CSV',
    );
    expect(mocks.open).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.database.close).not.toHaveBeenCalled();
  });

  it('ferme SQLite et propage une erreur pendant l’import', async () => {
    mocks.upsert.mockImplementationOnce(() => {
      throw new Error('genre import failed');
    });
    await expect(runCli(['add-genres', 'genres.csv'])).rejects.toThrow(
      'genre import failed',
    );
    expect(mocks.database.close).toHaveBeenCalledOnce();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('ferme SQLite et propage une erreur pendant le nettoyage', async () => {
    mocks.clean.mockImplementationOnce(() => {
      throw new Error('genre cleanup failed');
    });
    await expect(runCli(['clean-genres'])).rejects.toThrow(
      'genre cleanup failed',
    );
    expect(mocks.database.close).toHaveBeenCalledOnce();
    expect(console.log).not.toHaveBeenCalled();
  });
});
