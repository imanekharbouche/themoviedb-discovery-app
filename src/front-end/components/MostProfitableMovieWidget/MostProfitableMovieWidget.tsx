import { useState } from 'react';
import './MostProfitableMovieWidget.css';

/**
 * Règle de calcul du ROI (Retour sur investissement) et critères d'éligibilité :
 * - Formule validée : `ROI (%) = ((revenue - budget) / budget) * 100`.
 * - Éligibilité : un film est éligible uniquement si son `budget` est renseigné et strictement positif (`budget > 0`)
 *   et si sa recette `revenue` est renseignée (`revenue >= 0`, `NOT NULL`).
 * - Le composant consomme directement le `roiPercent` fourni sans recalculer ni classer les films côté client.
 *
 * Contrat des propriétés (`MostProfitableMovieWidgetProps`) :
 * - `title` : titre du film le plus rentable.
 * - `releaseYear` : année de sortie du film (affiche « Année inconnue » si absente).
 * - `roiPercent` : retour sur investissement en pourcentage (`>= -100`). Une valeur absente (`null` / `undefined`)
 *   affiche « Aucun film éligible » et n'est jamais présentée comme zéro.
 * - `posterUrl` : URL de l'affiche du film (remplacement explicite si absente ou inaccessible).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type MostProfitableMovieWidgetProps = {
  title?: string | null;
  releaseYear?: number | string | null;
  roiPercent?: number | null;
  posterUrl?: string | null;
  loading?: boolean;
  error?: string | null;
};

const roiFormatter = new Intl.NumberFormat('fr-FR', {
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
 * Widget « Film le plus rentable » affichant l'affiche, le titre, l'année et le ROI en pourcentage.
 */
export default function MostProfitableMovieWidget({
  title,
  releaseYear,
  roiPercent,
  posterUrl,
  loading = false,
  error = null,
}: MostProfitableMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedPosterUrl =
    typeof posterUrl === 'string' && posterUrl.trim().length > 0
      ? posterUrl.trim()
      : null;
  const hasValidMovie =
    normalizedTitle.length > 0 &&
    typeof roiPercent === 'number' &&
    Number.isFinite(roiPercent) &&
    roiPercent >= -100;
  const showPoster =
    normalizedPosterUrl !== null && failedPosterUrl !== normalizedPosterUrl;

  return (
    <section
      className="most-profitable-movie-widget"
      aria-label="Film le plus rentable"
    >
      <h2 className="most-profitable-movie-widget-title">
        Film le plus rentable
      </h2>

      {loading ? (
        <p className="most-profitable-movie-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="most-profitable-movie-widget-status most-profitable-movie-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidMovie ? (
        <div className="most-profitable-movie-widget-content">
          {showPoster ? (
            <img
              className="most-profitable-movie-widget-poster"
              src={normalizedPosterUrl}
              alt={`Affiche de ${normalizedTitle}`}
              onError={() => setFailedPosterUrl(normalizedPosterUrl)}
            />
          ) : (
            <div
              className="most-profitable-movie-widget-poster most-profitable-movie-widget-poster-fallback"
              role="img"
              aria-label={`Affiche indisponible pour ${normalizedTitle}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="most-profitable-movie-widget-details">
            <p className="most-profitable-movie-widget-movie-title">
              {normalizedTitle}
            </p>
            <p className="most-profitable-movie-widget-year">
              {formatReleaseYear(releaseYear)}
            </p>
            <p className="most-profitable-movie-widget-roi">
              {roiFormatter.format(roiPercent)}{' '}
              <span className="most-profitable-movie-widget-unit">% ROI</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="most-profitable-movie-widget-status">
          Aucun film éligible
        </p>
      )}
    </section>
  );
}
