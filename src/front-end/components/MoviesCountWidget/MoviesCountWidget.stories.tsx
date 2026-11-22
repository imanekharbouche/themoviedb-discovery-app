import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesCountWidget from './MoviesCountWidget';

const meta = {
  title: 'Widgets/MoviesCountWidget',
  component: MoviesCountWidget,
} satisfies Meta<typeof MoviesCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    count: 1000,
  },
};

export const ZeroFilm: Story = {
  args: {
    count: 0,
  },
};

export const AbsenceDeDonnees: Story = {
  args: {
    count: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger le nombre de films.',
  },
};
