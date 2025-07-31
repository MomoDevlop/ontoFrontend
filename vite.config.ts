import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@theme': path.resolve(__dirname, './src/theme'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/lab'],
          visualization: ['cytoscape', 'd3', 'react-cytoscapejs', 'react-force-graph-2d'],
          charts: ['recharts'],
          router: ['react-router-dom'],
        },
      },
    },
    // Increase chunk size warning limit for large dependencies
    chunkSizeWarningLimit: 1000,
  },

  // Define global constants
  define: {
    global: 'globalThis',
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material', 
      '@mui/lab',
      'axios',
      'cytoscape',
      'd3',
      'react-cytoscapejs',
      'react-force-graph-2d',
      'recharts',
      'react-router-dom',
    ],
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },
})