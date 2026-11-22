// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopRatedMovieWidget from './TopRatedMovieWidget';
import * as stories from './TopRatedMovieWidget.stories';

afterEach(cleanup);

describe('TopRatedMovieWidget', () => {
  it('renders the nominal top rated movie with poster, title, year, and 9,1 / 10 rating', () => {
    render(<TopRatedMovieWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Film le mieux noté' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Film le mieux noté' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Les Évadés' }),
    ).toBeTruthy();
    expect(screen.getByText('Les Évadés')).toBeTruthy();
    expect(screen.getByText('1994')).toBeTruthy();
    expect(screen.getByText(/9,1/)).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it('uses an explicit poster fallback when the poster is absent or fails to load, and handles unknown year', () => {
    const { unmount } = render(
      <TopRatedMovieWidget {...stories.AfficheAbsente.args} />,
    );
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(
      screen.getByText(/Le Seigneur des anneaux : Le Retour du roi/),
    ).toBeTruthy();
    unmount();

    render(
      <TopRatedMovieWidget
        title="Le Parrain"
        releaseYear="1972"
        rating={9.1}
        posterUrl="https://image.invalid/poster.jpg"
      />,
    );
    const img = screen.getByRole('img', { name: 'Affiche de Le Parrain' });
    fireEvent.error(img);
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Le Parrain',
      }),
    ).toBeTruthy();
    expect(screen.getByText('1972')).toBeTruthy();
  });

  it('renders empty, loading, and error states', () => {
    const { unmount } = render(
      <TopRatedMovieWidget {...stories.AucunFilmNote.args} />,
    );
    expect(screen.getByText('Aucun film noté')).toBeTruthy();
    unmount();

    const { unmount: unmountLoading } = render(
      <TopRatedMovieWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmountLoading();

    render(<TopRatedMovieWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le mieux noté.',
    );
  });
});
