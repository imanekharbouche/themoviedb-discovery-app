// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesCountWidget from './MoviesCountWidget';
import * as stories from './MoviesCountWidget.stories';

afterEach(cleanup);

describe('MoviesCountWidget', () => {
  it('renders the nominal movie count from the Storybook example', () => {
    render(<MoviesCountWidget {...stories.Nominal.args} />);

    expect(screen.getByRole('region', { name: 'Films en base' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Films en base' }),
    ).toBeTruthy();
    expect(screen.getByText('Effectif du catalogue')).toBeTruthy();
    expect(screen.getByText(/1\s*000/)).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
  });

  it('distinguishes zero movies from missing data', () => {
    const { unmount } = render(
      <MoviesCountWidget {...stories.ZeroFilm.args} />,
    );
    expect(screen.getByText(/^0$/)).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
    expect(screen.queryByText('Donnée indisponible')).toBeNull();
    unmount();

    render(<MoviesCountWidget {...stories.AbsenceDeDonnees.args} />);
    expect(screen.getByText('Donnée indisponible')).toBeTruthy();
  });

  it('renders the loading and error states defined in Storybook', () => {
    const { unmount } = render(
      <MoviesCountWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<MoviesCountWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le nombre de films.',
    );
  });
});
