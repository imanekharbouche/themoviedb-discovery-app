import type { Meta, StoryObj } from '@storybook/react-vite';
import GenresCountWidget from './GenresCountWidget';

const meta = {
  title: 'Widgets/GenresCountWidget',
  component: GenresCountWidget,
} satisfies Meta<typeof GenresCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    count: 19,
  },
};

export const ZeroGenre: Story = {
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
    error: 'Impossible de charger les genres représentés.',
  },
};
