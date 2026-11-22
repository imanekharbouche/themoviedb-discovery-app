import type { Meta, StoryObj } from '@storybook/react-vite';
import TopRatedMovieWidget from './TopRatedMovieWidget';

const posterDataUrl =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="152" height="228"><rect width="100%" height="100%" fill="%23176b86"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">Affiche</text></svg>';

const meta = {
  title: 'Widgets/TopRatedMovieWidget',
  component: TopRatedMovieWidget,
} satisfies Meta<typeof TopRatedMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    title: 'Les Évadés',
    releaseYear: 1994,
    rating: 9.1,
    posterUrl: posterDataUrl,
  },
};

export const AfficheAbsente: Story = {
  args: {
    title:
      'Le Seigneur des anneaux : Le Retour du roi (version longue restaurée)',
    releaseYear: null,
    rating: 9.1,
    posterUrl: null,
  },
};

export const AucunFilmNote: Story = {
  args: {
    title: null,
    rating: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger le film le mieux noté.',
  },
};
