// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BestRatedGenreWidget from './BestRatedGenreWidget';
import * as stories from './BestRatedGenreWidget.stories';

afterEach(cleanup);

describe('BestRatedGenreWidget', () => {
  it('renders the nominal best rated genre Animation with 7,41 / 10', () => {
    render(<BestRatedGenreWidget {...stories.Nominal.args} />);

    expect(screen.getByRole('region', { name: 'Meilleure note' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Meilleure note' }),
    ).toBeTruthy();
    expect(screen.getByText('Moyenne simple par genre')).toBeTruthy();
    expect(screen.getByText('Animation')).toBeTruthy();
    expect(screen.getByText(/7,41/)).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it('renders a long genre name and does not display a genre without ratings as zero', () => {
    const { unmount } = render(
      <BestRatedGenreWidget {...stories.NomLong.args} />,
    );
    expect(
      screen.getByText('Documentaire historique et biographique'),
    ).toBeTruthy();
    expect(screen.getByText(/7,41/)).toBeTruthy();
    unmount();

    const { unmount: unmountNoRating } = render(
      <BestRatedGenreWidget {...stories.GenreSansNote.args} />,
    );
    expect(screen.getByText('Aucune note disponible')).toBeTruthy();
    expect(screen.queryByText('/ 10')).toBeNull();
    unmountNoRating();

    render(<BestRatedGenreWidget genreName={null} averageRating={7.41} />);
    expect(screen.getByText('Aucune note disponible')).toBeTruthy();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <BestRatedGenreWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<BestRatedGenreWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la meilleure note par genre.',
    );
  });
});
