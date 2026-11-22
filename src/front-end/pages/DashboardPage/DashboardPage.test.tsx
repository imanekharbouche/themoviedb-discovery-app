// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders all 12 integrated widgets organized into three sections by default', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeDefined();

    // Three thematic sections
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Indicateurs du catalogue',
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Films remarquables' }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tendances par genre' }),
    ).toBeDefined();

    // All 12 widgets and their key values
    expect(screen.getByLabelText('Films en base')).toBeDefined();
    expect(screen.getByText(/999/)).toBeDefined();

    expect(screen.getByLabelText('Durée moyenne')).toBeDefined();
    expect(screen.getByText(/107/)).toBeDefined();

    expect(screen.getByLabelText('Note moyenne')).toBeDefined();
    expect(screen.getByText(/6,78/)).toBeDefined();

    expect(screen.getByLabelText('Pays le plus représenté')).toBeDefined();
    expect(screen.getByText('United States of America')).toBeDefined();
    expect(screen.getByText(/725/)).toBeDefined();

    expect(screen.getByLabelText('Film le mieux noté')).toBeDefined();
    expect(screen.getByText('Le Parrain')).toBeDefined();
    expect(screen.getByText(/9,1/)).toBeDefined();

    expect(screen.getByLabelText('Film le plus populaire')).toBeDefined();
    expect(screen.getByText('Super Mario Bros. le film')).toBeDefined();
    expect(screen.getByText(/1\s*036,49/)).toBeDefined();

    expect(screen.getByLabelText('Film le plus rentable')).toBeDefined();
    expect(screen.getByText('Paranormal Activity')).toBeDefined();
    expect(screen.getByText(/69\s*667,36/)).toBeDefined();

    expect(screen.getByLabelText('Film le moins rentable')).toBeDefined();
    expect(screen.getByText('The Adventures of Pluto Nash')).toBeDefined();
    expect(screen.getByText(/-100/)).toBeDefined();

    expect(screen.getByLabelText('Genres représentés').textContent).toContain(
      '19 genres',
    );

    expect(screen.getByLabelText('Genre dominant')).toBeDefined();
    expect(screen.getByText('Drame')).toBeDefined();
    expect(screen.getByText(/322/)).toBeDefined();

    expect(screen.getByLabelText('Meilleure note')).toBeDefined();
    expect(screen.getByText(/7,41/)).toBeDefined();

    expect(screen.getByLabelText('Meilleure note pondérée')).toBeDefined();
    expect(screen.getByText(/7,68/)).toBeDefined();
  });

  it('filters visible widget sections interactively when clicking category filter buttons', () => {
    render(<DashboardPage />);

    // Filter by Catalogue only
    fireEvent.click(screen.getByRole('button', { name: 'Catalogue' }));
    expect(screen.getByLabelText('Films en base')).toBeDefined();
    expect(screen.queryByLabelText('Film le mieux noté')).toBeNull();
    expect(screen.queryByLabelText('Genres représentés')).toBeNull();

    // Filter by Films remarquables only
    fireEvent.click(screen.getByRole('button', { name: 'Films remarquables' }));
    expect(screen.queryByLabelText('Films en base')).toBeNull();
    expect(screen.getByLabelText('Film le mieux noté')).toBeDefined();
    expect(screen.queryByLabelText('Genres représentés')).toBeNull();

    // Filter by Genres only
    fireEvent.click(screen.getByRole('button', { name: 'Genres' }));
    expect(screen.queryByLabelText('Films en base')).toBeNull();
    expect(screen.queryByLabelText('Film le mieux noté')).toBeNull();
    expect(screen.getByLabelText('Genres représentés')).toBeDefined();

    // Back to All
    fireEvent.click(
      screen.getByRole('button', { name: 'Tous les indicateurs' }),
    );
    expect(screen.getByLabelText('Films en base')).toBeDefined();
    expect(screen.getByLabelText('Film le mieux noté')).toBeDefined();
    expect(screen.getByLabelText('Genres représentés')).toBeDefined();
  });

  it('propagates loading and error states to all integrated widgets', () => {
    const { rerender } = render(<DashboardPage loading />);
    expect(screen.getAllByRole('status').length).toBe(12);

    rerender(<DashboardPage error="Erreur de chargement du tableau de bord" />);
    expect(screen.getAllByRole('alert').length).toBe(12);
  });

  it('renders the empty state when data is explicitly null', () => {
    render(<DashboardPage data={null} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun widget configuré',
      }),
    ).toBeDefined();
    expect(
      screen.getByText(
        /Le tableau de bord est prêt à accueillir vos indicateurs/,
      ),
    ).toBeDefined();
  });
});
