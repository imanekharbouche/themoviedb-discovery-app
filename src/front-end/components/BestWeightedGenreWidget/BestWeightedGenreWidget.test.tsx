// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BestWeightedGenreWidget, {
  formatBestWeightedGenreRating,
} from './BestWeightedGenreWidget';

describe('BestWeightedGenreWidget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the best weighted genre name and weighted rating formatted with two decimals on / 10', () => {
    render(
      <BestWeightedGenreWidget genreName="Animation" weightedRating={7.68} />,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Meilleure note pondérée',
      }),
    ).toBeDefined();
    expect(screen.getByText('Moyenne pondérée par genre')).toBeDefined();
    expect(screen.getByText('Animation')).toBeDefined();
    expect(screen.getByText('7,68 / 10')).toBeDefined();
  });

  it('formats whole numbers with two trailing zeroes on / 10 without arbitrary client weighting', () => {
    expect(formatBestWeightedGenreRating(8)).toBe('8,00 / 10');
    render(
      <BestWeightedGenreWidget genreName="Documentaire" weightedRating={8} />,
    );

    expect(screen.getByText('Documentaire')).toBeDefined();
    expect(screen.getByText('8,00 / 10')).toBeDefined();
  });

  it('renders the empty state when genre or weighted rating is missing, blank, or out of range', () => {
    const { rerender } = render(
      <BestWeightedGenreWidget genreName={null} weightedRating={null} />,
    );
    expect(screen.getByText('Aucune note pondérée disponible')).toBeDefined();

    rerender(<BestWeightedGenreWidget genreName="   " weightedRating={7.68} />);
    expect(screen.getByText('Aucune note pondérée disponible')).toBeDefined();

    rerender(
      <BestWeightedGenreWidget
        genreName="Animation"
        weightedRating={Number.NaN}
      />,
    );
    expect(screen.getByText('Aucune note pondérée disponible')).toBeDefined();

    rerender(
      <BestWeightedGenreWidget genreName="Animation" weightedRating={11} />,
    );
    expect(screen.getByText('Aucune note pondérée disponible')).toBeDefined();
  });

  it('renders the loading state when loading is true', () => {
    render(<BestWeightedGenreWidget loading />);

    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when an error message is provided', () => {
    render(
      <BestWeightedGenreWidget error="Erreur de calcul de la note pondérée" />,
    );

    expect(screen.getByRole('alert').textContent).toBe(
      'Erreur de calcul de la note pondérée',
    );
  });
});
