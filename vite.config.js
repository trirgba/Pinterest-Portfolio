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
        adminLogin: 'admin/login.html',
        adminDashboard: 'admin/dashboard.html',
      },
    },
  },
});
