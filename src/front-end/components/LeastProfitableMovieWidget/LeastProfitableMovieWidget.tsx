import { useState } from 'react';
import './LeastProfitableMovieWidget.css';

/**
 * Règle de calcul du ROI (Retour sur investissement) et critères d'éligibilité
 * (strictement identiques à ceux de `MostProfitableMovieWidget` — DASHBOARD-19) :
 * - Formule validée : `ROI (%) = ((revenue - budget) / budget) * 100`.
 * - Éligibilité : un film est éligible uniquement si son `budget` est renseigné et strictement positif (`budget > 0`)
 *   et si sa recette `revenue` est renseignée (`revenue >= 0`, `NOT NULL`).
 * - Le ROI minimum théorique est `-100 %` (lorsque `revenue = 0`). Le signe négatif est conservé.
 * - Une valeur nulle (`0 %`, lorsque `revenue = budget`) est valide et distincte d'une donnée absente (`null` / `undefined`).
 *
 * Contrat des propriétés (`LeastProfitableMovieWidgetProps`) :
 * - `title` : titre du film le moins rentable.
 * - `releaseYear` : année de sortie du film (affiche « Année inconnue » si absente).
 * - `roiPercent` : retour sur investissement en pourcentage (`>= -100`).
 * - `posterUrl` : URL de l'affiche du film (remplacement explicite si absente ou inaccessible).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type LeastProfitableMovieWidgetProps = {
  title?: string | null;
  releaseYear?: number | string | null;
  roiPercent?: number | null;
  posterUrl?: string | null;
  loading?: boolean;
  error?: string | null;
};

const roiFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
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

function formatRoi(roiPercent: number): string {
  const normalized = Object.is(roiPercent, -0) ? 0 : roiPercent;
  return roiFormatter.format(normalized);
}

/**
 * Widget « Film le moins rentable » affichant l'affiche, le titre, l'année et le ROI en pourcentage.
 */
export default function LeastProfitableMovieWidget({
  title,
  releaseYear,
  roiPercent,
  posterUrl,
  loading = false,
  error = null,
}: LeastProfitableMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const trimmedPoster =
    typeof posterUrl === 'string' && posterUrl.trim().length > 0
      ? posterUrl.trim()
      : null;
  const normalizedPosterUrl =
    trimmedPoster !== null && trimmedPoster.startsWith('/')
      ? `https://image.tmdb.org/t/p/w185${trimmedPoster}`
      : trimmedPoster;
  const hasValidMovie =
    normalizedTitle.length > 0 &&
    typeof roiPercent === 'number' &&
    Number.isFinite(roiPercent) &&
    roiPercent >= -100;
  const showPoster =
    normalizedPosterUrl !== null && failedPosterUrl !== normalizedPosterUrl;

  return (
    <section
      className="least-profitable-movie-widget"
      aria-label="Film le moins rentable"
    >
      <h2 className="least-profitable-movie-widget-title">
        Film le moins rentable
      </h2>

      {loading ? (
        <p className="least-profitable-movie-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="least-profitable-movie-widget-status least-profitable-movie-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidMovie ? (
        <div className="least-profitable-movie-widget-content">
          {showPoster ? (
            <img
              className="least-profitable-movie-widget-poster"
              src={normalizedPosterUrl}
              alt={`Affiche de ${normalizedTitle}`}
              onError={() => setFailedPosterUrl(normalizedPosterUrl)}
            />
          ) : (
            <div
              className="least-profitable-movie-widget-poster least-profitable-movie-widget-poster-fallback"
              role="img"
              aria-label={`Affiche indisponible pour ${normalizedTitle}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="least-profitable-movie-widget-details">
            <p className="least-profitable-movie-widget-movie-title">
              {normalizedTitle}
            </p>
            <p className="least-profitable-movie-widget-year">
              {formatReleaseYear(releaseYear)}
            </p>
            <p className="least-profitable-movie-widget-roi">
              {formatRoi(roiPercent)}{' '}
              <span className="least-profitable-movie-widget-unit">% ROI</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="least-profitable-movie-widget-status">
          Aucun film éligible
        </p>
      )}
    </section>
  );
}
