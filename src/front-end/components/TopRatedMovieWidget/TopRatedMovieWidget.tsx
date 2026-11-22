import { useState } from 'react';
import './TopRatedMovieWidget.css';

/**
 * Propriétés du widget affichant le film le mieux noté du catalogue.
 * - `title` : titre du film le mieux noté.
 * - `releaseYear` : année de sortie du film (affiche « Année inconnue » si absente).
 * - `rating` : note du film sur 10 (`[0, 10]`).
 * - `posterUrl` : URL de l'affiche du film (utilise un remplacement explicite si absente ou inaccessible).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type TopRatedMovieWidgetProps = {
  title?: string | null;
  releaseYear?: number | string | null;
  rating?: number | null;
  posterUrl?: string | null;
  loading?: boolean;
  error?: string | null;
};

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function formatReleaseYear(
  releaseYear: number | string | null | undefined,
): string {
  if (
    typeof releaseYear === 'number' &&
    Number.isInteger(releaseYear) &&
    releaseYear > 0
  ) {
    return String(releaseYear);
  }
  if (typeof releaseYear === 'string' && releaseYear.trim().length > 0) {
    return releaseYear.trim();
  }
  return 'Année inconnue';
}

/**
 * Widget « Film le mieux noté » affichant l'affiche, le titre, l'année et la note sur 10.
 */
export default function TopRatedMovieWidget({
  title,
  releaseYear,
  rating,
  posterUrl,
  loading = false,
  error = null,
}: TopRatedMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedPosterUrl =
    typeof posterUrl === 'string' && posterUrl.trim().length > 0
      ? posterUrl.trim()
      : null;
  const hasValidMovie =
    normalizedTitle.length > 0 &&
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating >= 0 &&
    rating <= 10;
  const showPoster =
    normalizedPosterUrl !== null && failedPosterUrl !== normalizedPosterUrl;

  return (
    <section className="top-rated-movie-widget" aria-label="Film le mieux noté">
      <h2 className="top-rated-movie-widget-title">Film le mieux noté</h2>

      {loading ? (
        <p className="top-rated-movie-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="top-rated-movie-widget-status top-rated-movie-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidMovie ? (
        <div className="top-rated-movie-widget-content">
          {showPoster ? (
            <img
              className="top-rated-movie-widget-poster"
              src={normalizedPosterUrl}
              alt={`Affiche de ${normalizedTitle}`}
              onError={() => setFailedPosterUrl(normalizedPosterUrl)}
            />
          ) : (
            <div
              className="top-rated-movie-widget-poster top-rated-movie-widget-poster-fallback"
              role="img"
              aria-label={`Affiche indisponible pour ${normalizedTitle}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="top-rated-movie-widget-details">
            <p className="top-rated-movie-widget-movie-title">
              {normalizedTitle}
            </p>
            <p className="top-rated-movie-widget-year">
              {formatReleaseYear(releaseYear)}
            </p>
            <p className="top-rated-movie-widget-rating">
              {ratingFormatter.format(rating)}{' '}
              <span className="top-rated-movie-widget-scale">/ 10</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="top-rated-movie-widget-status">Aucun film noté</p>
      )}
    </section>
  );
}
