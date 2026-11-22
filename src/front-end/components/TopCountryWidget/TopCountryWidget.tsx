import './TopCountryWidget.css';

/**
 * Propriétés du widget affichant le pays de production le plus représenté.
 * - `countryName` : nom du pays le plus représenté (déjà agrégé côté serveur/base sans recompter côté composant).
 * - `movieCount` : nombre de films associés à ce pays (`> 0`).
 * - `loading` : indique que les données sont en cours de chargement.
 * - `error` : message d'erreur à afficher en cas d'échec de récupération.
 */
export type TopCountryWidgetProps = {
  countryName?: string | null;
  movieCount?: number | null;
  loading?: boolean;
  error?: string | null;
};

/**
 * Widget « Pays le plus représenté » affichant le nom du pays dominant et son nombre de films.
 */
export default function TopCountryWidget({
  countryName,
  movieCount,
  loading = false,
  error = null,
}: TopCountryWidgetProps) {
  const normalizedName =
    typeof countryName === 'string' ? countryName.trim() : '';
  const hasValidData =
    normalizedName.length > 0 &&
    typeof movieCount === 'number' &&
    Number.isFinite(movieCount) &&
    movieCount > 0;

  return (
    <section
      className="top-country-widget"
      aria-label="Pays le plus représenté"
    >
      <h2 className="top-country-widget-title">Pays le plus représenté</h2>
      <p className="top-country-widget-subtitle">Origine principale</p>

      {loading ? (
        <p className="top-country-widget-status" role="status">
          Chargement…
        </p>
      ) : error ? (
        <p
          className="top-country-widget-status top-country-widget-status-error"
          role="alert"
        >
          {error}
        </p>
      ) : hasValidData ? (
        <>
          <p className="top-country-widget-name">{normalizedName}</p>
          <p className="top-country-widget-count">
            {Math.trunc(movieCount).toLocaleString('fr-FR')}{' '}
            <span className="top-country-widget-unit">films</span>
          </p>
        </>
      ) : (
        <p className="top-country-widget-status">Aucun pays connu</p>
      )}
    </section>
  );
}
