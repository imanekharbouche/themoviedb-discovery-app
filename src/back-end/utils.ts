import type { TmdbMoviesRawResponse, Movie } from './schemas/MoviesTypes';

/**
 * Transforms a TmdbMovie object into a supported Movie object by omitting the 'adult' and 'video' properties.
 * @param movieTmdb The raw TmdbMovie object.
 * @returns The supported Movie object.
 */


export const toSupportedMovie = (movieTmdb: TmdbMoviesRawResponse['results'][number]): Movie => {
  return {
    backdrop_path: movieTmdb.backdrop_path,
    genre_ids: movieTmdb.genre_ids,
    id: movieTmdb.id,
    original_language: movieTmdb.original_language,
    original_title: movieTmdb.original_title,
    overview: movieTmdb.overview,
    popularity: movieTmdb.popularity,
    poster_path: movieTmdb.poster_path,
    release_date: movieTmdb.release_date,
    title: movieTmdb.title,
    vote_average: movieTmdb.vote_average,
    vote_count: movieTmdb.vote_count
  };
};




