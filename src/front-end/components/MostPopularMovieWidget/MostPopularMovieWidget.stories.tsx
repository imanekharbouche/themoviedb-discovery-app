import type { Meta, StoryObj } from '@storybook/react-vite';
import MostPopularMovieWidget from './MostPopularMovieWidget';

const posterDataUrl =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="152" height="228"><rect width="100%" height="100%" fill="%23176b86"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">Affiche</text></svg>';

const meta = {
  title: 'Widgets/MostPopularMovieWidget',
  component: MostPopularMovieWidget,
} satisfies Meta<typeof MostPopularMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    title: 'Deadpool & Wolverine',
    releaseYear: 2024,
    popularity: 1036.49,
    posterUrl: posterDataUrl,
  },
};

export const AfficheAbsente: Story = {
  args: {
    title:
      'Pirates des Caraïbes : La Malédiction du Black Pearl (édition spéciale)',
    releaseYear: null,
    popularity: 1036.49,
    posterUrl: null,
  },
};

export const ValeurInconnue: Story = {
  args: {
    title: null,
    popularity: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger le film le plus populaire.',
  },
};
