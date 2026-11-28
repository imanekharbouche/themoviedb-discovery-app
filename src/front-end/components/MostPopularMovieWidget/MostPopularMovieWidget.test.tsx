// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget from './MostPopularMovieWidget';
import * as stories from './MostPopularMovieWidget.stories';

afterEach(cleanup);

describe('MostPopularMovieWidget', () => {
  it('renders the nominal most popular movie with 1 036,49 popularité', () => {
    render(<MostPopularMovieWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Film le plus populaire' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Film le plus populaire',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Deadpool & Wolverine' }),
    ).toBeTruthy();
    expect(screen.getByText('Deadpool & Wolverine')).toBeTruthy();
    expect(screen.getByText('2024')).toBeTruthy();
    expect(screen.getByText(/1\s*036,49/)).toBeTruthy();
    expect(screen.getByText('popularité')).toBeTruthy();
  });

  it('resolves a relative TMDB poster_path to a full TMDB image URL', () => {
    render(
      <MostPopularMovieWidget
        title="Spider-Man : Brand New Day"
        releaseYear={2026}
        popularity={1036.49}
        posterUrl="/spiderman.jpg"
      />,
    );
    const img = screen.getByRole('img', {
      name: 'Affiche de Spider-Man : Brand New Day',
    }) as HTMLImageElement;
    expect(img.src).toBe('https://image.tmdb.org/t/p/w185/spiderman.jpg');
  });

  it('uses an explicit fallback when the poster is absent or fails to load, and handles unknown year', () => {
    const { unmount } = render(
      <MostPopularMovieWidget {...stories.AfficheAbsente.args} />,
    );
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(
      screen.getByText(/Pirates des Caraïbes : La Malédiction du Black Pearl/),
    ).toBeTruthy();
    unmount();

    render(
      <MostPopularMovieWidget
        title="Dune"
        releaseYear="2021"
        popularity={512.3}
        posterUrl="https://image.invalid/poster.jpg"
      />,
    );
    const img = screen.getByRole('img', { name: 'Affiche de Dune' });
    fireEvent.error(img);
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Dune',
      }),
    ).toBeTruthy();
    expect(screen.getByText('2021')).toBeTruthy();
  });

  it('renders unknown value, loading, and error states', () => {
    const { unmount } = render(
      <MostPopularMovieWidget {...stories.ValeurInconnue.args} />,
    );
    expect(screen.getByText('Aucune popularité disponible')).toBeTruthy();
    expect(screen.queryByText('popularité')).toBeNull();
    unmount();

    const { unmount: unmountLoading } = render(
      <MostPopularMovieWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmountLoading();

    render(<MostPopularMovieWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le plus populaire.',
    );
  });
});
