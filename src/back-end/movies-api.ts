import express from 'express';
import { tmdbAccessToken } from './config';
import {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import { toSupportedMovie } from './utils';

export function registerMoviesApi(app: express.Express): void {
  // 1. Route pour les films populaires
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

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
      }
    },
  );
  app.get(
    '/api/movies/:id',
    async (req: express.Request, res: express.Response) => {
      const movieId = req.params.id;
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          if (response.status === 404) {
            res.status(404).json({ error: 'Movie not found' });
            return;
          }
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = await response.json();
        const movie = toSupportedMovie(rawData);
        res.json(movie);
      } catch (error) {
        console.error(`Error fetching movie ${movieId}:`, error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
      }
    },
  );
}
