// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DominantGenreWidget from './DominantGenreWidget';
import * as stories from './DominantGenreWidget.stories';

afterEach(cleanup);

describe('DominantGenreWidget', () => {
  it('renders the nominal dominant genre Drame with 322 films', () => {
    render(<DominantGenreWidget {...stories.Nominal.args} />);

    expect(screen.getByRole('region', { name: 'Genre dominant' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Genre dominant' }),
    ).toBeTruthy();
    expect(screen.getByText('Drame')).toBeTruthy();
    expect(screen.getByText(/322/)).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
  });

  it('renders a long genre name and handles incomplete or missing data', () => {
    const { unmount } = render(
      <DominantGenreWidget {...stories.NomLong.args} />,
    );
    expect(
      screen.getByText('Science-Fiction et Fantastique d’anticipation'),
    ).toBeTruthy();
    expect(screen.getByText(/185/)).toBeTruthy();
    unmount();

    const { unmount: unmountEmpty } = render(
      <DominantGenreWidget {...stories.AucunGenreConnu.args} />,
    );
    expect(screen.getByText('Aucun genre connu')).toBeTruthy();
    expect(screen.queryByText('films')).toBeNull();
    unmountEmpty();

    render(<DominantGenreWidget genreName="Drame" movieCount={0} />);
    expect(screen.getByText('Aucun genre connu')).toBeTruthy();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <DominantGenreWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<DominantGenreWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le genre dominant.',
    );
  });
});
