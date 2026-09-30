import { Link } from 'react-router';
import type { Movie } from '../../back-end/schemas/MoviesTypes';

type MovieItemProps = {
  movie: Movie;
};

export default function MovieItem({ movie }: MovieItemProps) {
  const releaseYear = movie.release_date.slice(0, 4);
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card-link">
      <div className="movie-card">
        {posterUrl ? (
          <img
            className="movie-poster"
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
          />
        ) : (
          <div
            className="movie-poster movie-poster--fallback"
            aria-label={`Affiche indisponible pour ${movie.title}`}
          />
        )}
        <div className="movie-card__content">
          <h2>{movie.title}</h2>
          <p>
            {releaseYear} · Note {movie.vote_average.toFixed(1)}
          </p>
        </div>
      </div>
    </Link>
  );
}
