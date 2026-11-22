import './MoviesCountWidget.css';

/**
 * Propriétés du widget affichant le nombre total de films stockés en base.
 * - `count` : nombre de films distincts en base (`null` ou `undefined` si la donnée est absente).
 * - `loading` : indique que le comptage est en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type MoviesCountWidgetProps = {
  count?: number | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Widget « Films en base » affichant l'effectif total du catalogue SQLite.
 */
export default function MoviesCountWidget({
  count,
  loading = false,
  error = null,
}: MoviesCountWidgetProps) {
  const hasValidCount =
    typeof count === 'number' && Number.isFinite(count) && count >= 0;

  return (
    <section className="movies-count-widget" aria-label="Films en base">
      <h2 className="movies-count-widget-title">Films en base</h2>
      <p className="movies-count-widget-subtitle">Effectif du catalogue</p>

      {loading ? (
        <p className="movies-count-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="movies-count-widget-status movies-count-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidCount ? (
        <p className="movies-count-widget-value">
          {Math.trunc(count).toLocaleString('fr-FR')}{' '}
          <span className="movies-count-widget-unit">films</span>
        </p>
      ) : (
        <p className="movies-count-widget-status">Donnée indisponible</p>
      )}
    </section>
  );
}
