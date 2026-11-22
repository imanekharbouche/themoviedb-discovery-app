import type { Meta, StoryObj } from '@storybook/react-vite';
import LeastProfitableMovieWidget from './LeastProfitableMovieWidget';

const posterDataUrl =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="152" height="228"><rect width="100%" height="100%" fill="%23176b86"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">Affiche</text></svg>';

const meta = {
  title: 'Widgets/LeastProfitableMovieWidget',
  component: LeastProfitableMovieWidget,
} satisfies Meta<typeof LeastProfitableMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    title: 'Zyzzyx Road',
    releaseYear: 2006,
    roiPercent: -100,
    posterUrl: posterDataUrl,
  },
};

export const ValeurNulleValide: Story = {
  args: {
    title: 'Film à l’équilibre',
    releaseYear: 2021,
    roiPercent: 0,
    posterUrl: posterDataUrl,
  },
};

export const AfficheAbsente: Story = {
  args: {
    title: ' Le 13e Guerrier ',
    releaseYear: null,
    roiPercent: -79.56,
    posterUrl: null,
  },
};

export const ValeurInconnue: Story = {
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
    error: 'Impossible de charger le film le moins rentable.',
  },
};
