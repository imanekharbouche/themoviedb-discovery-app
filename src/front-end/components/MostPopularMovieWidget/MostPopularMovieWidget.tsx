import { useState } from 'react';
import './MostPopularMovieWidget.css';

/**
 * Propriétés du widget affichant le film le plus populaire du catalogue.
 * - `title` : titre du film le plus populaire.
 * - `releaseYear` : année de sortie du film (affiche « Année inconnue » si absente).
 * - `popularity` : indice de popularité TMDB (`> 0`), présenté avec deux décimales et le libellé `popularité`
 *   (distinct d'une note sur 10 ou d'un nombre de votes).
 * - `posterUrl` : URL de l'affiche du film (utilise un remplacement explicite si absente ou inaccessible).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type MostPopularMovieWidgetProps = {
  title?: string | null;
  releaseYear?: number | string | null;
  popularity?: number | null;
  posterUrl?: string | null;
  loading?: boolean;
  error?: string | null;
};

const popularityFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
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
 * Widget « Film le plus populaire » affichant l'affiche, le titre, l'année et l'indice de popularité.
 */
export default function MostPopularMovieWidget({
  title,
  releaseYear,
  popularity,
  posterUrl,
  loading = false,
  error = null,
}: MostPopularMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedPosterUrl =
    typeof posterUrl === 'string' && posterUrl.trim().length > 0
      ? posterUrl.trim()
      : null;
  const hasValidMovie =
    normalizedTitle.length > 0 &&
    typeof popularity === 'number' &&
    Number.isFinite(popularity) &&
    popularity > 0;
  const showPoster =
    normalizedPosterUrl !== null && failedPosterUrl !== normalizedPosterUrl;

  return (
    <section
      className="most-popular-movie-widget"
      aria-label="Film le plus populaire"
    >
      <h2 className="most-popular-movie-widget-title">
        Film le plus populaire
      </h2>

      {loading ? (
        <p className="most-popular-movie-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="most-popular-movie-widget-status most-popular-movie-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidMovie ? (
        <div className="most-popular-movie-widget-content">
          {showPoster ? (
            <img
              className="most-popular-movie-widget-poster"
              src={normalizedPosterUrl}
              alt={`Affiche de ${normalizedTitle}`}
              onError={() => setFailedPosterUrl(normalizedPosterUrl)}
            />
          ) : (
            <div
              className="most-popular-movie-widget-poster most-popular-movie-widget-poster-fallback"
              role="img"
              aria-label={`Affiche indisponible pour ${normalizedTitle}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="most-popular-movie-widget-details">
            <p className="most-popular-movie-widget-movie-title">
              {normalizedTitle}
            </p>
            <p className="most-popular-movie-widget-year">
              {formatReleaseYear(releaseYear)}
            </p>
            <p className="most-popular-movie-widget-popularity">
              {popularityFormatter.format(popularity)}{' '}
              <span className="most-popular-movie-widget-unit">popularité</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="most-popular-movie-widget-status">
          Aucune popularité disponible
        </p>
      )}
    </section>
  );
}
