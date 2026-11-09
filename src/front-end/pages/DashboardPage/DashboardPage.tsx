import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <main className="app-shell dashboard-page">
      <header className="app-header">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <h2>
          Retrouvez bientôt les informations essentielles de votre catalogue.
        </h2>
      </header>

      <section
        className="dashboard-empty-state"
        aria-labelledby="dashboard-empty-title"
      >
        <h2 id="dashboard-empty-title">Aucun widget configuré</h2>
        <p>
          Le tableau de bord est prêt à accueillir vos indicateurs sur les
          films, les genres et les pays de production.
        </p>
      </section>
    </main>
  );
}
