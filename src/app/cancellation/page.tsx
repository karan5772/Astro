import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CancellationPage() {
  return (
    <>
      <Navbar variant="legal" />
      <main className="container fade-in main-content" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%', background: '#f39c12', opacity: 0.15 }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%', background: '#d35400', opacity: 0.15 }}></div>

        <div className="glass-card" style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', marginTop: '2rem' }}>
          <h1 className="hero-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cancellation &amp; Refund Policy
          </h1>
          
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
            We want you to be completely satisfied with your experience. If you need to cancel or request a refund, please follow the guidelines below.
          </p>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Cancellation
          </h2>
          <ul className="text-muted" style={{ paddingLeft: '1.25rem', marginBottom: '2rem', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '0.5rem' }}>You cannot cancel your subscription at this time. We will notify you when the feature is available.</li>
            <li style={{ marginBottom: '0.5rem' }}>If you have any questions or concerns, please contact us at <a href="mailto:karankumar8239@gmail.com" style={{ textDecoration: 'underline' }}>karankumar8239@gmail.com</a>.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Refunds
          </h2>
          <ul className="text-muted" style={{ paddingLeft: '1.25rem', marginBottom: '2rem', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '0.5rem' }}>We do not offer refunds at this time. We will notify you when the feature is available.</li>
            <li style={{ marginBottom: '0.5rem' }}>If you have any questions or concerns, please contact us at <a href="mailto:karankumar8239@gmail.com" style={{ textDecoration: 'underline' }}>karankumar8239@gmail.com</a>.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Exceptions
          </h2>
          <p className="text-muted" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            • If you have violated our Terms &amp; Conditions, we reserve the right to deny refunds.
          </p>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <p className="text-muted" style={{ lineHeight: '1.7' }}>
            For any questions regarding cancellation or refunds, please email us at{' '}
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
