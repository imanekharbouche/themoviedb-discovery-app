import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRuntimeWidget from './AverageRuntimeWidget';

const meta = {
  title: 'Widgets/AverageRuntimeWidget',
  component: AverageRuntimeWidget,
} satisfies Meta<typeof AverageRuntimeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    averageRuntimeMinutes: 107,
  },
};

export const AbsenceDeDonnees: Story = {
  args: {
    averageRuntimeMinutes: null,
  },
};

export const Chargement: Story = {
  args: {
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    error: 'Impossible de charger la durée moyenne.',
  },
};
