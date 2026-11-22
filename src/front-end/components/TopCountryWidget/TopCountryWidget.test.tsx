// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopCountryWidget from './TopCountryWidget';
import * as stories from './TopCountryWidget.stories';

afterEach(cleanup);

describe('TopCountryWidget', () => {
  it('renders the nominal country and movie count from Storybook', () => {
    render(<TopCountryWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Pays le plus représenté' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Pays le plus représenté',
      }),
    ).toBeTruthy();
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(screen.getByText(/725/)).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
  });

  it('renders a long country name and handles missing or incomplete data', () => {
    const { unmount } = render(<TopCountryWidget {...stories.NomLong.args} />);
    expect(screen.getByText(/Royaume-Uni de Grande-Bretagne/)).toBeTruthy();
    expect(screen.getByText(/142/)).toBeTruthy();
    unmount();

    const { unmount: unmountEmpty } = render(
      <TopCountryWidget {...stories.AucunPaysConnu.args} />,
    );
    expect(screen.getByText('Aucun pays connu')).toBeTruthy();
    expect(screen.queryByText('films')).toBeNull();
    unmountEmpty();

    render(<TopCountryWidget countryName="France" movieCount={0} />);
    expect(screen.getByText('Aucun pays connu')).toBeTruthy();
  });

  it('renders the loading and error states', () => {
    const { unmount } = render(
      <TopCountryWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmount();

    render(<TopCountryWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le pays le plus représenté.',
    );
  });
});
