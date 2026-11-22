import type { Express, Request, Response } from 'express';
import { toSupportedMovie } from '../utils/converter';
import { tmdbAccessToken } from '../utils/config';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

const INVALID_YEAR_MESSAGE =
  'year must be a four-digit year between 1000 and 9999';

function getQueryString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getYear(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) {
    return undefined;
  }

  const year = Number(value);
  return year >= 1000 && year <= 9999 ? value : undefined;
}

export function registerDiscoverApi(app: Express): void {
  app.get(
    '/api/discover/movies',
    async (request: Request, response: Response) => {
      const year = getYear(request.query.year);
      if (!year) {
        response.status(400).json({ error: INVALID_YEAR_MESSAGE });
        return;
      }

      const queryParams = new URLSearchParams({
        primary_release_year: year,
        language: getQueryString(request.query.language, DEFAULT_LANGUAGE),
        page: getQueryString(request.query.page, String(DEFAULT_PAGE)),
        region: getQueryString(request.query.region, DEFAULT_REGION),
      });

      try {
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!tmdbResponse.ok) {
          throw new Error(
            `TMDB API request failed with status ${tmdbResponse.status}`,
          );
        }

        const rawData = (await tmdbResponse.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        response.json(data);
      } catch (error) {
        console.error('Error discovering movies:', error);
        response.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );
}
