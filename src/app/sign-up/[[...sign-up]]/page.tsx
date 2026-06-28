"use client";

import { SignUp } from "@clerk/nextjs";
import Navbar from '@/components/Navbar';
import { useTheme } from '@/components/ThemeProvider';

export default function Page() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const appearance = {
    variables: {
      colorPrimary: '#6D5DFB',
      colorBackground: dark ? '#0a0a0a' : '#f8f3ea',
      colorText: dark ? '#ededed' : '#1c1a14',
      colorTextOnPrimaryBackground: '#ffffff',
      colorTextSecondary: dark ? 'rgba(237,237,237,0.55)' : '#7a7263',
      colorInputBackground: dark ? 'rgba(237,237,237,0.04)' : 'rgba(28,26,20,0.04)',
      colorInputText: dark ? '#ededed' : '#1c1a14',
      colorBorder: dark ? 'rgba(237,237,237,0.09)' : 'rgba(28,26,20,0.12)',
    },
    elements: {
      card: {
        border: dark ? '1px solid rgba(237,237,237,0.09)' : '1px solid rgba(28,26,20,0.12)',
        background: dark ? 'rgba(20,20,20,0.90)' : 'rgba(253,250,243,0.92)',
        backdropFilter: 'blur(16px)',
        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(109,93,251,0.06)'
          : '0 8px 32px rgba(28,26,20,0.08)',
        borderRadius: '12px',
      },
      headerTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: dark ? '#ededed' : '#1c1a14',
      },
      headerSubtitle: {
        color: dark ? 'rgba(237,237,237,0.55)' : '#7a7263',
      },
      socialButtonsBlockButton: {
        backgroundColor: dark ? 'rgba(237,237,237,0.04)' : 'rgba(28,26,20,0.04)',
        border: dark ? '1px solid rgba(237,237,237,0.09)' : '1px solid rgba(28,26,20,0.12)',
        borderRadius: '8px',
        color: dark ? '#ededed' : '#1c1a14',
      },
      socialButtonsBlockButtonText: {
        color: dark ? '#ededed' : '#1c1a14',
        fontWeight: '500',
      },
      dividerLine: {
        backgroundColor: dark ? 'rgba(237,237,237,0.09)' : 'rgba(28,26,20,0.10)',
      },
      dividerText: {
        color: dark ? 'rgba(237,237,237,0.40)' : '#7a7263',
      },
      formFieldLabel: {
        color: dark ? 'rgba(237,237,237,0.55)' : '#7a7263',
      },
      formFieldInput: {
        backgroundColor: dark ? 'rgba(237,237,237,0.04)' : 'rgba(28,26,20,0.04)',
        border: dark ? '1px solid rgba(237,237,237,0.09)' : '1px solid rgba(28,26,20,0.12)',
        borderRadius: '8px',
        color: dark ? '#ededed' : '#1c1a14',
      },
      formButtonPrimary: {
        backgroundColor: '#6D5DFB',
        color: '#ffffff',
        fontWeight: '600',
        borderRadius: '8px',
        padding: '0.75rem 1.5rem',
      },
      footerActionText: {
        color: dark ? 'rgba(237,237,237,0.50)' : '#7a7263',
      },
      footerActionLink: {
        color: '#6D5DFB',
        fontWeight: '600',
      },
      identityPreviewText: {
        color: dark ? '#ededed' : '#1c1a14',
      },
      formFieldInputShowPasswordButton: {
        color: dark ? 'rgba(237,237,237,0.40)' : '#7a7263',
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar variant="legal" />
      <main className="max-w-[1280px] mx-auto px-6 relative z-10 flex items-center justify-center flex-grow min-h-[calc(100vh-130px)] pt-[130px] pb-[60px] w-full">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl pointer-events-none" style={{ top: '20%', left: '10%' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" style={{ bottom: '20%', right: '10%' }} />
        <div className="relative z-10">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/" appearance={appearance} />
        </div>
      </main>
    </div>
  );
}
