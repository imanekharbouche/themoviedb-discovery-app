import type { Meta, StoryObj } from '@storybook/react-vite';
import DominantGenreWidget from './DominantGenreWidget';

const meta = {
  title: 'Widgets/DominantGenreWidget',
  component: DominantGenreWidget,
} satisfies Meta<typeof DominantGenreWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    genreName: 'Drame',
    movieCount: 322,
  },
};

export const NomLong: Story = {
  args: {
    genreName: 'Science-Fiction et Fantastique d’anticipation',
    movieCount: 185,
  },
};

export const AucunGenreConnu: Story = {
  args: {
    genreName: null,
    movieCount: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger le genre dominant.',
  },
};
