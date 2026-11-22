import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { tmdbAccessToken } from '../utils/config';
import { registerDiscoverApi } from './discover-api';
import type { TmdbMoviesRawResponse } from '../types/MoviesTypes';

const { toSupportedMovieMock } = vi.hoisted(() => ({
  toSupportedMovieMock: vi.fn(),
}));

vi.mock('../utils/converter', () => ({
  toSupportedMovie: toSupportedMovieMock,
}));

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(): RouteHandler {
  const handler = handlers.get('/api/discover/movies');
  if (!handler) throw new Error('Discover route is not registered');
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('discover API', () => {
  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    toSupportedMovieMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registers the route and uses defaults for an empty result', async () => {
    const rawData = {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    } as unknown as TmdbMoviesRawResponse;
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();
    await getHandler()(
      { query: { year: '2020' } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${tmdbAccessToken}`,
        }),
      }),
    );
    expect(response.json).toHaveBeenCalledWith(rawData);
  });

  it('passes custom options and converts returned movies', async () => {
    const rawMovie = { id: 7 };
    const rawData = {
      page: 2,
      results: [rawMovie],
      total_pages: 3,
      total_results: 1,
    } as unknown as TmdbMoviesRawResponse;
    const supportedMovie = { id: 7, title: 'Movie' };
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
    vi.stubGlobal('fetch', fetchMock);
    toSupportedMovieMock.mockReturnValue(supportedMovie);
    const response = createResponse();

    await getHandler()(
      {
        query: {
          year: '2020',
          language: 'en-US',
          page: '2',
          region: 'US',
        },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
      expect.any(Object),
    );
    expect(toSupportedMovieMock).toHaveBeenCalledWith(rawMovie, 0, [rawMovie]);
    expect(response.json).toHaveBeenCalledWith({
      page: 2,
      results: [supportedMovie],
      total_pages: 3,
      total_results: 1,
    });
  });

  it('rejects missing, invalid, multiple, and structured years without calling TMDB', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const invalidQueries = [
      {},
      { year: '999' },
      { year: '0000' },
      { year: '10000' },
      { year: 'abcd' },
      { year: ['2020', '2021'] },
      { year: { value: '2020' } },
    ];

    for (const query of invalidQueries) {
      const response = createResponse();
      await getHandler()({ query } as unknown as Request, response, vi.fn());
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'year must be a four-digit year between 1000 and 9999',
      });
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns HTTP 500 and logs HTTP, network, and JSON errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tmdbResponse({}, false, 503))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
    const responses = [createResponse(), createResponse(), createResponse()];

    for (const response of responses) {
      await getHandler()(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Failed to discover movies',
      });
    }

    expect(console.error).toHaveBeenCalledTimes(3);
  });
});
