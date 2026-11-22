// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';
import * as stories from './AverageRatingWidget.stories';

afterEach(cleanup);

describe('AverageRatingWidget', () => {
  it('renders the nominal average rating in French format with / 10 scale', () => {
    render(<AverageRatingWidget {...stories.Nominal.args} />);

    expect(screen.getByRole('region', { name: 'Note moyenne' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Note moyenne' }),
    ).toBeTruthy();
    expect(screen.getByText('Moyenne simple du catalogue')).toBeTruthy();
    expect(screen.getByText(/6,78/)).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it('distinguishes missing ratings from a valid zero rating', () => {
    const { unmount } = render(
      <AverageRatingWidget {...stories.AbsenceDeNotes.args} />,
    );
    expect(screen.getByText('Aucune note disponible')).toBeTruthy();
    expect(screen.queryByText('/ 10')).toBeNull();
    unmount();

    render(<AverageRatingWidget averageRating={0} />);
    expect(screen.getByText(/0,00/)).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <AverageRatingWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<AverageRatingWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la note moyenne.',
    );
  });
});
