import express from 'express';
import { tmdbAccessToken } from './config';
import {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import { toSupportedMovie } from './utils';

export function registerMoviesApi(app: express.Express): void {
  // Define a route handler for fetching popular movies from TMDB API
  app.get(
    '/api/movies/popular',
    async (_req: express.Request, res: express.Response) => {
      try {
        const response = await fetch(
          'https://api.themoviedb.org/3/movie/popular',
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        // Parse the raw response from the TMDB API
        const rawData = (await response.json()) as TmdbMoviesRawResponse;

        // Transform the raw data into the supported format for our application
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        // Send the transformed data as a JSON response
        res.json(data);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
      }
    },
  );
}
