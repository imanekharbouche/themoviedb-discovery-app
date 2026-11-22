// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import GenresCountWidget from './GenresCountWidget';
import * as stories from './GenresCountWidget.stories';

afterEach(cleanup);

describe('GenresCountWidget', () => {
  it('renders the nominal genres count of 19 genres with required labels', () => {
    render(<GenresCountWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Genres représentés' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Genres représentés' }),
    ).toBeTruthy();
    expect(screen.getByText('Diversité du catalogue')).toBeTruthy();
    expect(screen.getByText(/^19$/)).toBeTruthy();
    expect(screen.getByText('genres')).toBeTruthy();
  });

  it('distinguishes zero represented genres from missing data', () => {
    const { unmount } = render(
      <GenresCountWidget {...stories.ZeroGenre.args} />,
    );
    expect(screen.getByText(/^0$/)).toBeTruthy();
    expect(screen.getByText('genres')).toBeTruthy();
    expect(screen.queryByText('Donnée indisponible')).toBeNull();
    unmount();

    render(<GenresCountWidget {...stories.AbsenceDeDonnees.args} />);
    expect(screen.getByText('Donnée indisponible')).toBeTruthy();
    expect(screen.queryByText('genres')).toBeNull();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <GenresCountWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<GenresCountWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger les genres représentés.',
    );
  });
});
