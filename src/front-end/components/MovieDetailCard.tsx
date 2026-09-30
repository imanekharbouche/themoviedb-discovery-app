import './MovieDetailCard.css';
import type { Movie } from '../../back-end/schemas/MoviesTypes';

type MovieDetailCardProps = {
  movie: Movie;
};

export default function MovieDetailCard({ movie }: MovieDetailCardProps) {
  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const releaseYear = movie?.release_date?.slice(0, 4);
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return (
    <div className="movie-detail-card">
      <figure className="movie-detail-hero-container">
        {posterUrl ? (
          <img
            className="movie-detail-hero"
            src={posterUrl}
            alt={`Affiche de ${movie?.title}`}
          />
        ) : (
          <div className="movie-detail-hero movie-detail-hero-placeholder" />
        )}
      </figure>

      <div className="movie-detail-copy">
        <p className="movie-detail-kicker">Détails du film</p>
        <h1>{movie?.title}</h1>

        {movie?.tagline && (
          <p className="movie-detail-tagline">{movie.tagline}</p>
        )}

        <dl className="movie-detail-meta">
          <div>
            <dt style={{ display: 'none' }}>Année de sortie</dt>
            <dd>Année de sortie {releaseYear}</dd>
          </div>
          <div>
            <dt style={{ display: 'none' }}>Note</dt>
            <dd>Note {rating}</dd>
          </div>
        </dl>

        {movie?.genres && movie.genres.length > 0 && (
          <div className="movie-detail-section">
            <h2>Genres</h2>
            <ul className="movie-detail-genres">
              {movie.genres.map((genre: { id: number; name: string }) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="movie-detail-section">
          <h2>Résumé</h2>
          <p>{movie?.overview || 'Aucun résumé disponible pour ce film.'}</p>
        </div>
      </div>
    </div>
  );
}
