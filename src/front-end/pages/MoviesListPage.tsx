import { useEffect, useState } from 'react';
import MovieItem from '../components/MovieItem';
import type {
  MoviesApiResponse,
  Movie,
} from '../../back-end/schemas/MoviesTypes';

export default function MoviesListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        const response = await fetch('/api/movies/popular', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Impossible de récupérer les films');
        const data = (await response.json()) as MoviesApiResponse;
        setMovies(data.results);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }
        console.error(
          'Erreur lors de la récupération des films :',
          requestError,
        );
        setError('Impossible de charger les films populaires.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchMovies();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <main className="app-shell">
        <p className="status-message">Chargement des films...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <p className="status-message" role="alert">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-header">
        <h1>Films populaires</h1>
      </div>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieItem key={movie.id} movie={movie} />
        ))}
      </div>
    </main>
  );
}
