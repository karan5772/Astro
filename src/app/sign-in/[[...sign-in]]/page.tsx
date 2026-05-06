import { SignIn } from "@clerk/nextjs";
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Page() {
  return (
    <>
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Sparkles className="text-primary" size={24} />
            <span>Astro AI</span>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ paddingTop: '80px' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '15%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '15%' }}></div>
        
        <div className="relative z-10 fade-in">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </>
  );
}
