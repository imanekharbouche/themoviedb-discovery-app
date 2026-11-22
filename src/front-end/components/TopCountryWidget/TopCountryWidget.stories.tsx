import type { Meta, StoryObj } from '@storybook/react-vite';
import TopCountryWidget from './TopCountryWidget';

const meta = {
  title: 'Widgets/TopCountryWidget',
  component: TopCountryWidget,
} satisfies Meta<typeof TopCountryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    countryName: 'United States of America',
    movieCount: 725,
  },
};

export const NomLong: Story = {
  args: {
    countryName:
      'Royaume-Uni de Grande-Bretagne et d’Irlande du Nord (coproduction internationale)',
    movieCount: 142,
  },
};

export const AucunPaysConnu: Story = {
  args: {
    countryName: null,
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
    error: 'Impossible de charger le pays le plus représenté.',
  },
};
