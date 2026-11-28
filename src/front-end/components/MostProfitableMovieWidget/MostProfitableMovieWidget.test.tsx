// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostProfitableMovieWidget, {
  calculateMovieRoi,
} from './MostProfitableMovieWidget';
import * as stories from './MostProfitableMovieWidget.stories';

afterEach(cleanup);

describe('MostProfitableMovieWidget', () => {
  it('renders the nominal most profitable movie with 69 667,36 % ROI', () => {
    render(<MostProfitableMovieWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Film le plus rentable' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Film le plus rentable',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Paranormal Activity' }),
    ).toBeTruthy();
    expect(screen.getByText('Paranormal Activity')).toBeTruthy();
    expect(screen.getByText('2007')).toBeTruthy();
    expect(screen.getByText(/69\s*667,36/)).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
  });

  it('calculates ROI accurately and rejects zero-budget or missing-budget films, and resolves relative poster_path', () => {
    expect(calculateMovieRoi(0, 1000000)).toBeNull();
    expect(calculateMovieRoi(-500, 1000000)).toBeNull();
    expect(calculateMovieRoi(null, 1000000)).toBeNull();
    expect(calculateMovieRoi(10000, null)).toBeNull();
    expect(calculateMovieRoi(10000, -1)).toBeNull();
    expect(calculateMovieRoi(10000, 0)).toBe(-100);
    expect(calculateMovieRoi(10000, 10000)).toBe(0);
    expect(calculateMovieRoi(15000, 10465104)).toBeCloseTo(69667.36, 2);

    render(
      <MostProfitableMovieWidget
        title="Obsession"
        releaseYear={2026}
        roiPercent={69667.36}
        posterUrl="/obsession.jpg"
      />,
    );
    const img = screen.getByRole('img', {
      name: 'Affiche de Obsession',
    }) as HTMLImageElement;
    expect(img.src).toBe('https://image.tmdb.org/t/p/w185/obsession.jpg');
  });

  it('uses an explicit poster fallback when absent or failing, and handles unknown year and zero ROI', () => {
    const { unmount } = render(
      <MostProfitableMovieWidget {...stories.AfficheAbsente.args} />,
    );
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.getByText('Le Projet Blair Witch')).toBeTruthy();
    unmount();

    render(
      <MostProfitableMovieWidget
        title="Film à l’équilibre"
        releaseYear="2022"
        roiPercent={0}
        posterUrl="https://image.invalid/poster.jpg"
      />,
    );
    const img = screen.getByRole('img', {
      name: 'Affiche de Film à l’équilibre',
    });
    fireEvent.error(img);
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Film à l’équilibre',
      }),
    ).toBeTruthy();
    expect(screen.getByText('2022')).toBeTruthy();
    expect(screen.getByText(/0,00/)).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
  });

  it('does not display missing ROI as zero and renders loading and error states', () => {
    const { unmount } = render(
      <MostProfitableMovieWidget {...stories.AucunFilmEligible.args} />,
    );
    expect(screen.getByText('Aucun film éligible')).toBeTruthy();
    expect(screen.queryByText('% ROI')).toBeNull();
    unmount();

    const { unmount: unmountLoading } = render(
      <MostProfitableMovieWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmountLoading();

    render(<MostProfitableMovieWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le plus rentable.',
    );
  });
});
