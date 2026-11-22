import './AverageRuntimeWidget.css';

/**
 * Propriétés du widget affichant la durée moyenne des films du catalogue.
 * - `averageRuntimeMinutes` : durée moyenne en minutes calculée sur les durées valides (`> 0`).
 *   Une donnée absente (`null`, `undefined`, ou `<= 0`) affiche un état sans donnée et non zéro.
 * - `loading` : indique que le calcul est en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type AverageRuntimeWidgetProps = {
  averageRuntimeMinutes?: number | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Widget « Durée moyenne » affichant la durée moyenne des films en minutes (`min`).
 */
export default function AverageRuntimeWidget({
  averageRuntimeMinutes,
  loading = false,
  error = null,
}: AverageRuntimeWidgetProps) {
  const hasValidRuntime =
    typeof averageRuntimeMinutes === 'number' &&
    Number.isFinite(averageRuntimeMinutes) &&
    averageRuntimeMinutes > 0;

  return (
    <section className="average-runtime-widget" aria-label="Durée moyenne">
      <h2 className="average-runtime-widget-title">Durée moyenne</h2>
      <p className="average-runtime-widget-subtitle">Durée des films</p>

      {loading ? (
        <p className="average-runtime-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="average-runtime-widget-status average-runtime-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidRuntime ? (
        <p className="average-runtime-widget-value">
          {Math.round(averageRuntimeMinutes).toLocaleString('fr-FR')}{' '}
          <span className="average-runtime-widget-unit">min</span>
        </p>
      ) : (
        <p className="average-runtime-widget-status">Aucune durée disponible</p>
      )}
    </section>
  );
}
