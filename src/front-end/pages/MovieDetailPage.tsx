import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import type { Movie } from '../../back-end/schemas/MoviesTypes';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    async function fetchMovieDetails() {
      try {
        // Appel à la route back-end de détail que vous avez créée
        const response = await fetch(`/api/movies/${id}`);
        if (!response.ok) throw new Error('Film introuvable');
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des détails :', error);
      }
    }

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  if (!movie) {
    return (
      <main className="app-shell">
        <p>Chargement des détails du film...</p>
      </main>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const releaseYear = movie.release_date?.slice(0, 4);

  return (
    <main className="app-shell">
      <Link
        to="/movies"
        style={{ textDecoration: 'none', color: '#2f6f95', fontWeight: 'bold' }}
      >
        ← Retour aux films populaires
      </Link>

      <div
        style={{
          display: 'flex',
          gap: '32px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        {posterUrl && (
          <img
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
            style={{
              borderRadius: '14px',
              maxWidth: '300px',
              width: '100%',
              objectFit: 'cover',
              boxShadow: '0 8px 18px rgb(41 69 99 / 15%)',
            }}
          />
        )}

        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1
            style={{ fontSize: '2.5rem', marginBottom: '8px', marginTop: '0' }}
          >
            {movie.title}
          </h1>
          <p
            style={{
              fontSize: '1.2rem',
              color: '#455576',
              marginBottom: '24px',
            }}
          >
            {releaseYear} • Note : {movie.vote_average?.toFixed(1)}/10
          </p>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Synopsis</h2>
          <p
            style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#1a1a1a' }}
          >
            {movie.overview || 'Aucun synopsis disponible pour ce film.'}
          </p>
        </div>
      </div>
    </main>
  );
}
