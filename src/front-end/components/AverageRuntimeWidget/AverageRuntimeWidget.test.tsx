// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRuntimeWidget from './AverageRuntimeWidget';
import * as stories from './AverageRuntimeWidget.stories';

afterEach(cleanup);

describe('AverageRuntimeWidget', () => {
  it('renders the nominal average runtime of 107 min', () => {
    render(<AverageRuntimeWidget {...stories.Nominal.args} />);

    expect(screen.getByRole('region', { name: 'Durée moyenne' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Durée moyenne' }),
    ).toBeTruthy();
    expect(screen.getByText(/107/)).toBeTruthy();
    expect(screen.getByText('min')).toBeTruthy();
  });

  it('does not turn missing or non-positive runtime data into zero', () => {
    const { unmount } = render(
      <AverageRuntimeWidget {...stories.AbsenceDeDonnees.args} />,
    );
    expect(screen.getByText('Aucune durée disponible')).toBeTruthy();
    expect(screen.queryByText('min')).toBeNull();
    unmount();

    render(<AverageRuntimeWidget averageRuntimeMinutes={0} />);
    expect(screen.getByText('Aucune durée disponible')).toBeTruthy();
    expect(screen.queryByText('min')).toBeNull();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <AverageRuntimeWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<AverageRuntimeWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la durée moyenne.',
    );
  });
});
