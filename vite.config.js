import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        project: 'project.html',
        adminLogin: 'admin/index.html',
        adminDashboard: 'admin/dashboard.html',
        ad: 'ad/index.html',
      },
    },
  },
});
