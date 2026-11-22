import './AverageRatingWidget.css';

/**
 * Propriétés du widget affichant la note moyenne simple des films du catalogue.
 * - `averageRating` : moyenne simple (arithmétique) des notes du catalogue sur 10 (`[0, 10]`),
 *   distincte d'une note pondérée et non calculée sur une seule page.
 *   `null` ou `undefined` indique qu'aucune note valide n'est disponible.
 * - `loading` : indique que la note moyenne est en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type AverageRatingWidgetProps = {
  averageRating?: number | null;
  loading?: boolean;
  error?: string | null;
};

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Widget « Note moyenne » affichant la moyenne simple du catalogue avec deux décimales et l'échelle `/ 10`.
 */
export default function AverageRatingWidget({
  averageRating,
  loading = false,
  error = null,
}: AverageRatingWidgetProps) {
  const hasValidRating =
    typeof averageRating === 'number' &&
    Number.isFinite(averageRating) &&
    averageRating >= 0 &&
    averageRating <= 10;

  return (
    <section className="average-rating-widget" aria-label="Note moyenne">
      <h2 className="average-rating-widget-title">Note moyenne</h2>
      <p className="average-rating-widget-subtitle">
        Moyenne simple du catalogue
      </p>

      {loading ? (
        <p className="average-rating-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="average-rating-widget-status average-rating-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidRating ? (
        <p className="average-rating-widget-value">
          {ratingFormatter.format(averageRating)}{' '}
          <span className="average-rating-widget-scale">/ 10</span>
        </p>
      ) : (
        <p className="average-rating-widget-status">Aucune note disponible</p>
      )}
    </section>
  );
}
