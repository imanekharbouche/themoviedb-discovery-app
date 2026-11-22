import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

const meta = {
  title: 'Widgets/AverageRatingWidget',
  component: AverageRatingWidget,
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    averageRating: 6.78,
  },
};

export const AbsenceDeNotes: Story = {
  args: {
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
    error: 'Impossible de charger la note moyenne.',
  },
};
