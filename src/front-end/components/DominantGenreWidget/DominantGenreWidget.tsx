import './DominantGenreWidget.css';

/**
 * Propriétés du widget affichant le genre le plus présent dans le catalogue.
 * - `genreName` : nom du genre dominant fourni (le composant n'effectue aucun recomptage sur les films multigenres).
 * - `movieCount` : nombre de films associés à ce genre (`> 0`).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type DominantGenreWidgetProps = {
  genreName?: string | null;
  movieCount?: number | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Widget « Genre dominant » affichant le nom du genre le plus présent et son effectif en films.
 */
export default function DominantGenreWidget({
  genreName,
  movieCount,
  loading = false,
  error = null,
}: DominantGenreWidgetProps) {
  const normalizedName = typeof genreName === 'string' ? genreName.trim() : '';
  const hasValidData =
    normalizedName.length > 0 &&
    typeof movieCount === 'number' &&
    Number.isFinite(movieCount) &&
    movieCount > 0;

  return (
    <section className="dominant-genre-widget" aria-label="Genre dominant">
      <h2 className="dominant-genre-widget-title">Genre dominant</h2>
      <p className="dominant-genre-widget-subtitle">Tendance du catalogue</p>

      {loading ? (
        <p className="dominant-genre-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="dominant-genre-widget-status dominant-genre-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidData ? (
        <>
          <p className="dominant-genre-widget-name">{normalizedName}</p>
          <p className="dominant-genre-widget-count">
            {Math.trunc(movieCount).toLocaleString('fr-FR')}{' '}
            <span className="dominant-genre-widget-unit">films</span>
          </p>
        </>
      ) : (
        <p className="dominant-genre-widget-status">Aucun genre connu</p>
      )}
    </section>
  );
}
