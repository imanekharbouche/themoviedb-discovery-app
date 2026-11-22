import type { Meta, StoryObj } from '@storybook/react-vite';
import MostProfitableMovieWidget from './MostProfitableMovieWidget';

const posterDataUrl =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="152" height="228"><rect width="100%" height="100%" fill="%23176b86"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">Affiche</text></svg>';

const meta = {
  title: 'Widgets/MostProfitableMovieWidget',
  component: MostProfitableMovieWidget,
} satisfies Meta<typeof MostProfitableMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    title: 'Paranormal Activity',
    releaseYear: 2007,
    roiPercent: 69667.36,
    posterUrl: posterDataUrl,
  },
};

export const AfficheAbsente: Story = {
  args: {
    title: 'Le Projet Blair Witch',
    releaseYear: null,
    roiPercent: 69667.36,
    posterUrl: null,
  },
};

export const AucunFilmEligible: Story = {
  args: {
    title: null,
    roiPercent: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger le film le plus rentable.',
  },
};
