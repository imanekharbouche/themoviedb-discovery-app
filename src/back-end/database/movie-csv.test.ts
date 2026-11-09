import { describe, expect, it } from 'vitest';
import { parseMoviesCsv } from './movie-csv.ts';

const csv = `id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries
1,"A, movie",Original,en,,2020-01-01,10.5,7.2,100,/poster,/backdrop,120,1000,2000,"[18,35]","[{""iso_3166_1"":""FR"",""name"":""France""}]"
`;

describe('movie-csv', () => {
  it('parses movie values, optional fields, and JSON associations', () => {
    expect(parseMoviesCsv(csv)).toEqual([
      {
        id: 1,
        title: 'A, movie',
        original_title: 'Original',
        original_language: 'en',
        overview: '',
        release_date: '2020-01-01',
        popularity: 10.5,
        vote_average: 7.2,
        vote_count: 100,
        poster_path: '/poster',
        backdrop_path: '/backdrop',
        runtime_minutes: 120,
        budget: 1000,
        revenue: 2000,
        genre_ids: [18, 35],
        countries: [{ code: 'FR', name: 'France' }],
      },
    ]);
  });

  it('accepts empty optional values', () => {
    const emptyValues = csv
      .replace(',120,1000,2000,', ',,, ,')
      .replace(',"[{""iso_3166_1"":""FR"",""name"":""France""}]"', ',"[]"');

    expect(parseMoviesCsv(emptyValues)[0]).toMatchObject({
      runtime_minutes: undefined,
      budget: undefined,
      revenue: undefined,
      countries: [],
    });
  });

  it('rejects invalid headers, values, and JSON', () => {
    expect(() => parseMoviesCsv('id,title\n1,Movie')).toThrow(
      'unexpected headers',
    );
    expect(() =>
      parseMoviesCsv(csv.replace(',120,1000,2000,', ',0,1000,2000,')),
    ).toThrow('runtime must be positive');
    expect(() => parseMoviesCsv(csv.replace('"[18,35]"', '"invalid"'))).toThrow(
      'genres must be valid JSON',
    );
    expect(() => parseMoviesCsv('')).toThrow('header is missing');
    expect(() => parseMoviesCsv('"unterminated')).toThrow(
      'Invalid movies CSV:',
    );
    expect(() => parseMoviesCsv(csv.replace(',10.5,', ',invalid,'))).toThrow(
      'popularity must be a number',
    );
    expect(() => parseMoviesCsv(csv.replace('"A, movie"', ''))).toThrow(
      'missing title',
    );
    expect(() => parseMoviesCsv(csv.replace('"[18,35]"', '"[0]"'))).toThrow(
      'associations are invalid',
    );
    expect(() => parseMoviesCsv(csv.replace('"[18,35]"', '"{}"'))).toThrow(
      'associations are invalid',
    );
    expect(() =>
      parseMoviesCsv(
        csv.replace('"[{""iso_3166_1"":""FR"",""name"":""France""}]"', '"{}"'),
      ),
    ).toThrow('associations are invalid');
    expect(() =>
      parseMoviesCsv(
        csv.replace(
          '"[{""iso_3166_1"":""FR"",""name"":""France""}]"',
          '"[{""iso_3166_1"":""FR"",""name"":""""}]"',
        ),
      ),
    ).toThrow('associations are invalid');
  });
});
