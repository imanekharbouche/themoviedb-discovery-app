// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders the dashboard without widgets', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun widget configuré',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Le tableau de bord est prêt à accueillir vos indicateurs/,
      ),
    ).toBeTruthy();
  });
});
