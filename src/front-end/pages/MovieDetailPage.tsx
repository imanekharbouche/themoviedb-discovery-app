import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import type { Movie } from '../../back-end/schemas/MoviesTypes';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMovieDetails() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/movies/${id}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Film introuvable');
        const data = (await response.json()) as Movie;
        setMovie(data);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }
        console.error(
          'Erreur lors de la récupération des détails :',
          requestError,
        );
        setError('Impossible de charger les détails du film.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    if (id) {
      fetchMovieDetails();
    }

    return () => controller.abort();
  }, [id]);

  if (isLoading) {
    return (
      <main className="app-shell">
        <p>Chargement des détails du film...</p>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="app-shell">
        <p className="status-message" role="alert">
          {error ?? 'Film introuvable.'}
        </p>
        <Link to="/movies">Retour vers les films populaires</Link>
      </main>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const releaseYear = movie.release_date?.slice(0, 4);

  return (
    <main className="app-shell">
      <h1
        style={{
          fontSize: '3rem',
          fontWeight: '900',
          color: '#1a202c',
          margin: '0 0 4px 0',
        }}
      >
        Détails du film
      </h1>
      <Link
        to="/movies"
        style={{
          color: '#5b21b6',
          textDecoration: 'underline',
          display: 'inline-block',
          marginBottom: '24px',
          fontWeight: '500',
        }}
      >
        ← Retour vers les films populaires
      </Link>

      <div
        style={{
          backgroundColor: '#f4f9f9',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex',
          gap: '40px',
          flexWrap: 'wrap',
        }}
      >
        {/* Colonne Gauche : Affiche */}
        <div style={{ flexShrink: 0, minWidth: '300px' }}>
          {posterUrl && (
            <img
              src={posterUrl}
              alt={`Affiche de ${movie.title}`}
              style={{
                borderRadius: '16px',
                width: '100%',
                maxWidth: '380px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              }}
            />
          )}
        </div>

        {/* Colonne Droite : Informations */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flex: '1',
            minWidth: '300px',
          }}
        >
          <div>
            <span
              style={{
                color: '#0d9488',
                fontWeight: '800',
                fontSize: '0.8rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Détails du film
            </span>
            <h2
              style={{
                fontSize: '3.5rem',
                fontWeight: '900',
                color: '#1e293b',
                margin: '4px 0',
              }}
            >
              {movie.title}
            </h2>
            {movie.tagline && (
              <p style={{ fontSize: '1.3rem', color: '#475569', margin: 0 }}>
                {movie.tagline}
              </p>
            )}
          </div>

          {/* Badges Année et Note */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                color: '#1e293b',
              }}
            >
              Année de sortie {releaseYear}
            </span>
            <span
              style={{
                backgroundColor: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                color: '#1e293b',
              }}
            >
              Note {movie.vote_average?.toFixed(1)}
            </span>
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  color: '#1e293b',
                  margin: '0 0 12px 0',
                }}
              >
                Genres
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {movie.genres.map((genre: { id: number; name: string }) => (
                  <span
                    key={genre.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#1e293b',
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Résumé */}
          <div>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: '#1e293b',
                margin: '0 0 8px 0',
              }}
            >
              Résumé
            </h3>
            <p
              style={{
                color: '#334155',
                lineHeight: '1.6',
                fontSize: '1.1rem',
                margin: 0,
              }}
            >
              {movie.overview || 'Aucun résumé disponible pour ce film.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
