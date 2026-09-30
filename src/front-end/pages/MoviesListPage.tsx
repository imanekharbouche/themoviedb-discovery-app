import { useEffect, useState } from 'react';
import MovieItem from '../components/MovieItem';
import type { Movie } from '../../back-end/schemas/MoviesTypes';

export default function MoviesListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/movies/popular');
        const data = await response.json();
        setMovies(data.results || data);
      } catch (error) {
        console.error('Erreur lors de la récupération des films :', error);
      }
    }
    fetchMovies();
  }, []);

  return (
    <main className="app-shell">
      <h1>Films Populaires</h1>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieItem key={movie.id} movie={movie} />
        ))}
      </div>
    </main>
  );
}
