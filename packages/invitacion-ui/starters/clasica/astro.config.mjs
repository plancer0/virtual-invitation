// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
 fonts: [
    {
      provider: fontProviders.google(),
      name: "Baskervville",
      cssVariable: "--baskervville",
    },
    {
      provider: fontProviders.google(),
      name: "Baskervville SC",
      cssVariable: "--baskervville-sc",
    },
    {
      provider: fontProviders.google(),
      name: "Mea Culpa",
      cssVariable: "--meaculpa",
    }
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
