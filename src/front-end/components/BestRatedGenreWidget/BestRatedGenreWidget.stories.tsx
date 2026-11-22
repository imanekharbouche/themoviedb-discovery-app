import type { Meta, StoryObj } from '@storybook/react-vite';
import BestRatedGenreWidget from './BestRatedGenreWidget';

const meta = {
  title: 'Widgets/BestRatedGenreWidget',
  component: BestRatedGenreWidget,
} satisfies Meta<typeof BestRatedGenreWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    genreName: 'Animation',
    averageRating: 7.41,
  },
};

export const NomLong: Story = {
  args: {
    genreName: 'Documentaire historique et biographique',
    averageRating: 7.41,
  },
};

export const GenreSansNote: Story = {
  args: {
    genreName: 'Animation',
    averageRating: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger la meilleure note par genre.',
  },
};
