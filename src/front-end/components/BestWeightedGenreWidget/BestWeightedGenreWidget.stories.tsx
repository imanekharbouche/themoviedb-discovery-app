import type { Meta, StoryObj } from '@storybook/react-vite';
import BestWeightedGenreWidget from './BestWeightedGenreWidget';

const meta = {
  title: 'Dashboard/BestWeightedGenreWidget',
  component: BestWeightedGenreWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BestWeightedGenreWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    genreName: 'Animation',
    weightedRating: 7.68,
  },
};

export const NomLong: Story = {
  args: {
    genreName: 'Science-Fiction et Fantastique Expérimental',
    weightedRating: 8.15,
  },
};

export const AucunResultat: Story = {
  args: {
    genreName: null,
    weightedRating: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger la meilleure note pondérée.',
  },
};
