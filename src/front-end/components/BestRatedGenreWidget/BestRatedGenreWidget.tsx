import './BestRatedGenreWidget.css';

/**
 * Propriétés du widget affichant le genre ayant la meilleure note moyenne simple.
 * - `genreName` : nom du genre ayant la meilleure note moyenne.
 * - `averageRating` : moyenne arithmétique simple des notes des films de ce genre sur 10 (`[0, 10]`),
 *   distincte de la note pondérée (DASHBOARD-24). Un genre sans notes valides (`null` ou `undefined`)
 *   n'est pas affiché comme noté zéro mais affiche « Aucune note disponible ».
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type BestRatedGenreWidgetProps = {
  genreName?: string | null;
  averageRating?: number | null;
  loading?: boolean;
  error?: string | null;
};

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Widget « Meilleure note » affichant le genre ayant la meilleure moyenne simple avec deux décimales et l'échelle `/ 10`.
 */
export default function BestRatedGenreWidget({
  genreName,
  averageRating,
  loading = false,
  error = null,
}: BestRatedGenreWidgetProps) {
  const normalizedName = typeof genreName === 'string' ? genreName.trim() : '';
  const hasValidData =
    normalizedName.length > 0 &&
    typeof averageRating === 'number' &&
    Number.isFinite(averageRating) &&
    averageRating >= 0 &&
    averageRating <= 10;

  return (
    <section className="best-rated-genre-widget" aria-label="Meilleure note">
      <h2 className="best-rated-genre-widget-title">Meilleure note</h2>
      <p className="best-rated-genre-widget-subtitle">
        Moyenne simple par genre
      </p>

      {loading ? (
        <p className="best-rated-genre-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="best-rated-genre-widget-status best-rated-genre-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidData ? (
        <>
          <p className="best-rated-genre-widget-name">{normalizedName}</p>
          <p className="best-rated-genre-widget-rating">
            {ratingFormatter.format(averageRating)}{' '}
            <span className="best-rated-genre-widget-scale">/ 10</span>
          </p>
        </>
      ) : (
        <p className="best-rated-genre-widget-status">Aucune note disponible</p>
      )}
    </section>
  );
}
