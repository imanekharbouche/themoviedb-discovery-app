import React from 'react';
import './BestWeightedGenreWidget.css';

/**
 * Formule validée pour la meilleure note pondérée par genre :
 * - Moyenne pondérée par le nombre de votes (vote_count) des films associés au genre :
 *   weightedRating(g) = SUM(vote_average_i * vote_count_i) / SUM(vote_count_i)
 * - Critère d'éligibilité : un genre est éligible s'il possède au moins un film avec
 *   une note valide (vote_average IS NOT NULL) et un nombre de votes strictement positif
 *   (SUM(vote_count_i) > 0).
 * - Le composant de présentation consomme directement `genreName` et `weightedRating`
 *   sans recalculer ni appliquer de pondération arbitraire côté client.
 */
export type BestWeightedGenreWidgetProps = {
  /** Nom du genre obtenant la meilleure moyenne pondérée (ex. "Animation") */
  genreName?: string | null;
  /** Moyenne pondérée sur 10 calculée selon la formule validée (ex. 7.68) */
  weightedRating?: number | null;
  /** Indique si la donnée est en cours de chargement */
  loading?: boolean;
  /** Message d'erreur éventuel lors de la récupération */
  error?: string | null;
};

/**
 * Formate la note moyenne pondérée sur 10 avec deux décimales (convention fr-FR).
 */
export function formatBestWeightedGenreRating(weightedRating: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(weightedRating);
  return `${formatted} / 10`;
}

/**
 * Widget du tableau de bord affichant le genre ayant la meilleure note pondérée.
 */
export default function BestWeightedGenreWidget({
  genreName,
  weightedRating,
  loading = false,
  error = null,
}: BestWeightedGenreWidgetProps): React.JSX.Element {
  const trimmedName = typeof genreName === 'string' ? genreName.trim() : '';
  const hasValidGenre =
    trimmedName.length > 0 &&
    typeof weightedRating === 'number' &&
    Number.isFinite(weightedRating) &&
    weightedRating >= 0 &&
    weightedRating <= 10;

  return (
    <article
      className="best-weighted-genre-widget"
      aria-label="Meilleure note pondérée"
    >
      <header className="best-weighted-genre-widget__header">
        <h2 className="best-weighted-genre-widget__title">
          Meilleure note pondérée
        </h2>
        <p className="best-weighted-genre-widget__subtitle">
          Moyenne pondérée par genre
        </p>
      </header>
      <div className="best-weighted-genre-widget__body">
        {loading ? (
          <p className="best-weighted-genre-widget__status" role="status">
            Chargement…
          </p>
        ) : error ? (
          <p
            className="best-weighted-genre-widget__status best-weighted-genre-widget__status--error"
            role="alert"
          >
            {error}
          </p>
        ) : hasValidGenre ? (
          <>
            <p className="best-weighted-genre-widget__genre-name">
              {trimmedName}
            </p>
            <p className="best-weighted-genre-widget__value">
              {formatBestWeightedGenreRating(weightedRating)}
            </p>
          </>
        ) : (
          <p className="best-weighted-genre-widget__status">
            Aucune note pondérée disponible
          </p>
        )}
      </div>
    </article>
  );
}
