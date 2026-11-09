#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { parseGenresCsv } from './database/genre-csv.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import { importMoviesFromCsv } from './movie-csv-import.ts';

/** Command-line interface for movie database operations. */
const program = new Command().description('CLI for movie database operations');

program
  .command('create-database')
  .description('Create and initialize the movies database schema')
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  )
  .action(({ path }: { path: string }) => {
    const database = getDatabase(path);
    database.close();
    console.log(`Database available at ${resolve(path)}`);
  });

program
  .command('add-genres <csv-file>')
  .description('Import genres from a CSV file')
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  )
  .action((csvFile: string, { path }: { path: string }) => {
    const genres = parseGenresCsv(readFileSync(csvFile, 'utf8'));
    const database = getDatabase(path);
    try {
      upsertGenres(database, genres);
      console.log(`${genres.length} genres imported into ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program
  .command('clean-genres')
  .description('Remove genres that are not associated with a movie')
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  )
  .action(({ path }: { path: string }) => {
    const database = getDatabase(path);
    try {
      const deletedCount = deleteUnusedGenres(database);
      console.log(`${deletedCount} genres removed from ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program
  .command('import-movies <csv-file>')
  .description('Import or update movies from a CSV file')
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  )
  .action((csvFile: string, { path }: { path: string }) => {
    const csvContent = readFileSync(csvFile, 'utf8');
    const database = getDatabase(path);
    try {
      const count = importMoviesFromCsv(database, csvContent);
      console.log(`${count} movies imported into ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program.parse();
