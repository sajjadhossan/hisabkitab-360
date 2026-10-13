import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-excel';
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/html5-qrcode') || id.includes('node_modules/qrcode')) {
            return 'vendor-barcode-scanner';
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'vendor-capacitor';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
          if (id.includes('components/business/POSTerminal')) {
            return 'module-pos';
          }
          if (id.includes('components/business/InventoryManager')) {
            return 'module-inventory';
          }
          if (id.includes('components/business/InvoicesManager')) {
            return 'module-invoices';
          }
          if (id.includes('components/common/DebtKhataManager')) {
            return 'module-debts';
          }
        }
      }
    }
  }
})
