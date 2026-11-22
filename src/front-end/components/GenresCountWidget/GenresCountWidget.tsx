import './GenresCountWidget.css';

/**
 * Propriétés du widget affichant le nombre de genres distincts représentés dans le catalogue.
 * - `count` : nombre de genres distincts représentés (`>= 0`). Le composant consomme directement
 *   le nombre de genres distincts fourni et ne compte pas les associations film-genre.
 *   Une valeur zéro valide (`0`) est distinguée d'une donnée inconnue (`null` ou `undefined`).
 * - `loading` : indique que le comptage est en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type GenresCountWidgetProps = {
  count?: number | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Widget « Genres représentés » affichant la diversité du catalogue en nombre de genres distincts.
 */
export default function GenresCountWidget({
  count,
  loading = false,
  error = null,
}: GenresCountWidgetProps) {
  const hasValidCount =
    typeof count === 'number' && Number.isFinite(count) && count >= 0;

  return (
    <section className="genres-count-widget" aria-label="Genres représentés">
      <h2 className="genres-count-widget-title">Genres représentés</h2>
      <p className="genres-count-widget-subtitle">Diversité du catalogue</p>

      {loading ? (
        <p className="genres-count-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="genres-count-widget-status genres-count-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidCount ? (
        <p className="genres-count-widget-value">
          {Math.trunc(count).toLocaleString('fr-FR')}{' '}
          <span className="genres-count-widget-unit">genres</span>
        </p>
      ) : (
        <p className="genres-count-widget-status">Donnée indisponible</p>
      )}
    </section>
  );
}
