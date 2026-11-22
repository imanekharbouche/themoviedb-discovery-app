import type { Meta, StoryObj } from '@storybook/react-vite';
import DashboardPage, { DEFAULT_DASHBOARD_DATA } from './DashboardPage';

const meta = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complet: Story = {
  args: {
    data: DEFAULT_DASHBOARD_DATA,
  },
};

export const Chargement: Story = {
  args: {
    data: DEFAULT_DASHBOARD_DATA,
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    data: DEFAULT_DASHBOARD_DATA,
    error: 'Impossible de charger les indicateurs du tableau de bord.',
  },
};

export const SansWidgets: Story = {
  args: {
    data: null,
  },
};
