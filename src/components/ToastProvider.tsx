"use client";

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'rgba(20, 20, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(243, 156, 18, 0.3)',
          color: '#fff',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: '#f39c12',
            secondary: '#111',
          },
          duration: 4000,
        },
        error: {
          iconTheme: {
            primary: '#ff4757',
            secondary: '#fff',
          },
          duration: 5000,
        },
      }}
    />
  );
}
