// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LeastProfitableMovieWidget from './LeastProfitableMovieWidget';
import * as stories from './LeastProfitableMovieWidget.stories';

afterEach(cleanup);

describe('LeastProfitableMovieWidget', () => {
  it('renders the nominal least profitable movie with -100 % ROI and preserves the negative sign', () => {
    render(<LeastProfitableMovieWidget {...stories.Nominal.args} />);

    expect(
      screen.getByRole('region', { name: 'Film le moins rentable' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Film le moins rentable',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de Zyzzyx Road' }),
    ).toBeTruthy();
    expect(screen.getByText('Zyzzyx Road')).toBeTruthy();
    expect(screen.getByText('2006')).toBeTruthy();
    expect(screen.getByText(/-100/)).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
  });

  it('resolves a relative TMDB poster_path to a full TMDB image URL', () => {
    render(
      <LeastProfitableMovieWidget
        title="Mémoires d’un escargot"
        releaseYear={2025}
        roiPercent={-100}
        posterUrl="/boAU3nGNP10cRCRnVUF3HiIZ8E9.jpg"
      />,
    );
    const img = screen.getByRole('img', {
      name: 'Affiche de Mémoires d’un escargot',
    }) as HTMLImageElement;
    expect(img.src).toBe(
      'https://image.tmdb.org/t/p/w185/boAU3nGNP10cRCRnVUF3HiIZ8E9.jpg',
    );
  });

  it('distinguishes negative ROI, valid zero ROI, and missing ROI value', () => {
    const { unmount } = render(
      <LeastProfitableMovieWidget {...stories.ValeurNulleValide.args} />,
    );
    expect(screen.getByText('Film à l’équilibre')).toBeTruthy();
    expect(screen.getByText(/^0\s*$/)).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
    unmount();

    const { unmount: unmountNegativeZero } = render(
      <LeastProfitableMovieWidget
        title="Film neutre"
        releaseYear="2020"
        roiPercent={-0}
      />,
    );
    expect(screen.getByText(/^0\s*$/)).toBeTruthy();
    expect(screen.getByText('2020')).toBeTruthy();
    unmountNegativeZero();

    render(<LeastProfitableMovieWidget {...stories.ValeurInconnue.args} />);
    expect(screen.getByText('Aucun film éligible')).toBeTruthy();
    expect(screen.queryByText('% ROI')).toBeNull();
  });

  it('handles absent or failing poster, loading, and error states', () => {
    const { unmount } = render(
      <LeastProfitableMovieWidget {...stories.AfficheAbsente.args} />,
    );
    expect(screen.getByText('Affiche indisponible')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.getByText(/-79,56/)).toBeTruthy();
    unmount();

    const { unmount: unmountFailingImg } = render(
      <LeastProfitableMovieWidget
        title="Mars Needs Moms"
        releaseYear={2011}
        roiPercent={-74}
        posterUrl="https://image.invalid/poster.jpg"
      />,
    );
    fireEvent.error(
      screen.getByRole('img', { name: 'Affiche de Mars Needs Moms' }),
    );
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Mars Needs Moms',
      }),
    ).toBeTruthy();
    unmountFailingImg();

    const { unmount: unmountLoading } = render(
      <LeastProfitableMovieWidget {...stories.Chargement.args} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    unmountLoading();

    render(<LeastProfitableMovieWidget {...stories.Erreur.args} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le moins rentable.',
    );
  });
});
