"use client";

import { useEffect } from 'react';
import { SignUp } from "@clerk/nextjs";
import Navbar from '@/components/Navbar';
import '../../astraeus.css';

export default function Page() {
  useEffect(() => {
    document.body.classList.add('astraeus-active');
    return () => {
      document.body.classList.remove('astraeus-active');
    };
  }, []);

  return (
    <div className="theme-astraeus min-h-screen flex flex-col">
      <Navbar variant="legal" />

      <main className="astral-container relative z-10" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, minHeight: 'calc(100vh - 130px)', paddingTop: '130px', paddingBottom: '60px' }}>
        {/* Glow Background Orbs */}
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>
        
        <div className="relative z-10 fade-in">
          <SignUp 
            path="/sign-up" 
            routing="path" 
            signInUrl="/sign-in" 
            fallbackRedirectUrl="/" 
            appearance={{
              variables: {
                colorPrimary: '#6D5DFB',
                colorBackground: '#0F1115',
                colorText: '#ffffff',
                colorTextOnPrimaryBackground: '#ffffff',
                colorTextSecondary: '#c0c6db',
                colorInputBackground: 'rgba(255, 255, 255, 0.03)',
                colorInputText: '#ffffff',
                colorBorder: 'rgba(255, 255, 255, 0.08)',
              },
              elements: {
                card: {
                  border: '1px solid #27272A',
                  background: 'rgba(24, 24, 27, 0.85)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 0 40px rgba(109, 93, 251, 0.05)',
                  borderRadius: '8px',
                },
                headerTitle: {
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#ffffff',
                },
                headerSubtitle: {
                  color: '#c0c6db',
                },
                socialButtonsBlockButton: {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderColor: 'var(--primary)',
                  }
                },
                socialButtonsBlockButtonText: {
                  color: '#ffffff',
                  fontWeight: '500',
                },
                dividerLine: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                dividerText: {
                  color: '#c0c6db',
                },
                formFieldLabel: {
                  color: '#c0c6db',
                },
                formFieldInput: {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  '&:focus': {
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }
                },
                formButtonPrimary: {
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: '600',
                  textTransform: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#4f46e5',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(109, 93, 251, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                },
                footerActionText: {
                  color: '#c0c6db',
                },
                footerActionLink: {
                  color: 'var(--primary)',
                  fontWeight: '600',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: '#4f46e5',
                    textDecoration: 'underline',
                  }
                },
                identityPreviewText: {
                  color: '#ffffff',
                },
                formFieldInputShowPasswordButton: {
                  color: '#c0c6db',
                }
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
