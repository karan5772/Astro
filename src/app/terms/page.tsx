import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar variant="legal" />
      <main className="container fade-in main-content" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%', background: '#f39c12', opacity: 0.15 }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%', background: '#d35400', opacity: 0.15 }}></div>

        <div className="glass-card" style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', marginTop: '2rem' }}>
          <h1 className="hero-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Terms &amp; Conditions
          </h1>
          
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
            By accessing or using Astro AI, you agree to be bound by the following terms and conditions. Please read them carefully.
          </p>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            1. Service Description
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            Astro AI provides AI‑generated astrological insights, chat, and voice sessions. The service is offered on a subscription basis.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            2. User Accounts
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            You must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your login credentials.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            3. Payments &amp; Billing
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            Subscriptions are billed in advance on a recurring basis. All fees are non‑refundable except as outlined in the Cancellation &amp; Refund Policy.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            4. Prohibited Use
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            You may not misuse the service, reverse‑engineer, or attempt to access the underlying AI models. Abuse may result in termination of your account.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            5. Limitation of Liability
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            Astro AI is provided “as is”. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
            6. Changes to Terms
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <p className="text-muted" style={{ lineHeight: '1.7' }}>
            For any questions, please contact us at{' '}
            <a href="mailto:karankumar8239@gmail.com" className="text-gradient font-semibold" style={{ textDecoration: 'underline', background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              karankumar8239@gmail.com
            </a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
