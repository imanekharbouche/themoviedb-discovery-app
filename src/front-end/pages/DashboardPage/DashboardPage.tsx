import React, { useState } from 'react';
import AverageRatingWidget from '../../components/AverageRatingWidget/AverageRatingWidget';
import AverageRuntimeWidget from '../../components/AverageRuntimeWidget/AverageRuntimeWidget';
import BestRatedGenreWidget from '../../components/BestRatedGenreWidget/BestRatedGenreWidget';
import BestWeightedGenreWidget from '../../components/BestWeightedGenreWidget/BestWeightedGenreWidget';
import DominantGenreWidget from '../../components/DominantGenreWidget/DominantGenreWidget';
import GenresCountWidget from '../../components/GenresCountWidget/GenresCountWidget';
import LeastProfitableMovieWidget from '../../components/LeastProfitableMovieWidget/LeastProfitableMovieWidget';
import MostPopularMovieWidget from '../../components/MostPopularMovieWidget/MostPopularMovieWidget';
import MostProfitableMovieWidget from '../../components/MostProfitableMovieWidget/MostProfitableMovieWidget';
import MoviesCountWidget from '../../components/MoviesCountWidget/MoviesCountWidget';
import TopCountryWidget from '../../components/TopCountryWidget/TopCountryWidget';
import TopRatedMovieWidget from '../../components/TopRatedMovieWidget/TopRatedMovieWidget';
import './DashboardPage.css';

export type DashboardCategoryFilter = 'all' | 'catalogue' | 'movies' | 'genres';

export type DashboardWidgetsData = {
  moviesCount: number | null;
  averageRuntimeMinutes: number | null;
  averageRating: number | null;
  topCountry: {
    countryName: string | null;
    moviesCount: number | null;
  };
  topRatedMovie: {
    title: string | null;
    releaseYear?: number | string | null;
    rating: number | null;
    posterUrl?: string | null;
  };
  mostPopularMovie: {
    title: string | null;
    releaseYear?: number | string | null;
    popularity: number | null;
    posterUrl?: string | null;
  };
  mostProfitableMovie: {
    title: string | null;
    releaseYear?: number | string | null;
    roiPercentage: number | null;
    posterUrl?: string | null;
  };
  leastProfitableMovie: {
    title: string | null;
    releaseYear?: number | string | null;
    roiPercentage: number | null;
    posterUrl?: string | null;
  };
  genresCount: number | null;
  dominantGenre: {
    genreName: string | null;
    moviesCount: number | null;
  };
  bestRatedGenre: {
    genreName: string | null;
    averageRating: number | null;
  };
  bestWeightedGenre: {
    genreName: string | null;
    weightedRating: number | null;
  };
};

export const DEFAULT_DASHBOARD_DATA: DashboardWidgetsData = {
  moviesCount: 999,
  averageRuntimeMinutes: 107,
  averageRating: 6.78,
  topCountry: {
    countryName: 'United States of America',
    moviesCount: 725,
  },
  topRatedMovie: {
    title: 'Le Parrain',
    releaseYear: 1972,
    rating: 9.1,
    posterUrl: null,
  },
  mostPopularMovie: {
    title: 'Super Mario Bros. le film',
    releaseYear: 2023,
    popularity: 1036.49,
    posterUrl: null,
  },
  mostProfitableMovie: {
    title: 'Paranormal Activity',
    releaseYear: 2007,
    roiPercentage: 69667.36,
    posterUrl: null,
  },
  leastProfitableMovie: {
    title: 'The Adventures of Pluto Nash',
    releaseYear: 2002,
    roiPercentage: -100,
    posterUrl: null,
  },
  genresCount: 19,
  dominantGenre: {
    genreName: 'Drame',
    moviesCount: 322,
  },
  bestRatedGenre: {
    genreName: 'Animation',
    averageRating: 7.41,
  },
  bestWeightedGenre: {
    genreName: 'Animation',
    weightedRating: 7.68,
  },
};

export type DashboardPageProps = {
  /** Données des widgets du tableau de bord (`null` pour afficher l'état vide sans widgets) */
  data?: DashboardWidgetsData | null;
  /** Indique si tous les widgets sont en chargement */
  loading?: boolean;
  /** Message d'erreur global propagé aux widgets */
  error?: string | null;
};

const FILTER_OPTIONS: { id: DashboardCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Tous les indicateurs' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'movies', label: 'Films remarquables' },
  { id: 'genres', label: 'Genres' },
];

export default function DashboardPage({
  data = DEFAULT_DASHBOARD_DATA,
  loading = false,
  error = null,
}: DashboardPageProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] =
    useState<DashboardCategoryFilter>('all');

  const showCatalogue = activeFilter === 'all' || activeFilter === 'catalogue';
  const showMovies = activeFilter === 'all' || activeFilter === 'movies';
  const showGenres = activeFilter === 'all' || activeFilter === 'genres';

  return (
    <main className="app-shell dashboard-page">
      <header className="app-header">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <h2>
          Synthèse des indicateurs clés sur les films, les genres et les pays de
          production.
        </h2>
      </header>

      {data === null ? (
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
      ) : (
        <>
          <nav
            className="dashboard-filters"
            aria-label="Filtrer les sections du tableau de bord"
          >
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`dashboard-filter-button${isActive ? ' dashboard-filter-button--active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </nav>

          <div className="dashboard-sections">
            {showCatalogue ? (
              <section
                className="dashboard-section"
                aria-labelledby="dashboard-section-catalogue"
              >
                <h2
                  id="dashboard-section-catalogue"
                  className="dashboard-section__title"
                >
                  Indicateurs du catalogue
                </h2>
                <div className="dashboard-grid">
                  <MoviesCountWidget
                    count={data.moviesCount}
                    loading={loading}
                    error={error}
                  />
                  <AverageRuntimeWidget
                    averageRuntimeMinutes={data.averageRuntimeMinutes}
                    loading={loading}
                    error={error}
                  />
                  <AverageRatingWidget
                    averageRating={data.averageRating}
                    loading={loading}
                    error={error}
                  />
                  <TopCountryWidget
                    countryName={data.topCountry.countryName}
                    movieCount={data.topCountry.moviesCount}
                    loading={loading}
                    error={error}
                  />
                </div>
              </section>
            ) : null}

            {showMovies ? (
              <section
                className="dashboard-section"
                aria-labelledby="dashboard-section-movies"
              >
                <h2
                  id="dashboard-section-movies"
                  className="dashboard-section__title"
                >
                  Films remarquables
                </h2>
                <div className="dashboard-grid">
                  <TopRatedMovieWidget
                    title={data.topRatedMovie.title}
                    releaseYear={data.topRatedMovie.releaseYear}
                    rating={data.topRatedMovie.rating}
                    posterUrl={data.topRatedMovie.posterUrl}
                    loading={loading}
                    error={error}
                  />
                  <MostPopularMovieWidget
                    title={data.mostPopularMovie.title}
                    releaseYear={data.mostPopularMovie.releaseYear}
                    popularity={data.mostPopularMovie.popularity}
                    posterUrl={data.mostPopularMovie.posterUrl}
                    loading={loading}
                    error={error}
                  />
                  <MostProfitableMovieWidget
                    title={data.mostProfitableMovie.title}
                    releaseYear={data.mostProfitableMovie.releaseYear}
                    roiPercent={data.mostProfitableMovie.roiPercentage}
                    posterUrl={data.mostProfitableMovie.posterUrl}
                    loading={loading}
                    error={error}
                  />
                  <LeastProfitableMovieWidget
                    title={data.leastProfitableMovie.title}
                    releaseYear={data.leastProfitableMovie.releaseYear}
                    roiPercent={data.leastProfitableMovie.roiPercentage}
                    posterUrl={data.leastProfitableMovie.posterUrl}
                    loading={loading}
                    error={error}
                  />
                </div>
              </section>
            ) : null}

            {showGenres ? (
              <section
                className="dashboard-section"
                aria-labelledby="dashboard-section-genres"
              >
                <h2
                  id="dashboard-section-genres"
                  className="dashboard-section__title"
                >
                  Tendances par genre
                </h2>
                <div className="dashboard-grid">
                  <GenresCountWidget
                    count={data.genresCount}
                    loading={loading}
                    error={error}
                  />
                  <DominantGenreWidget
                    genreName={data.dominantGenre.genreName}
                    movieCount={data.dominantGenre.moviesCount}
                    loading={loading}
                    error={error}
                  />
                  <BestRatedGenreWidget
                    genreName={data.bestRatedGenre.genreName}
                    averageRating={data.bestRatedGenre.averageRating}
                    loading={loading}
                    error={error}
                  />
                  <BestWeightedGenreWidget
                    genreName={data.bestWeightedGenre.genreName}
                    weightedRating={data.bestWeightedGenre.weightedRating}
                    loading={loading}
                    error={error}
                  />
                </div>
              </section>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
