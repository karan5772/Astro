export default function PrivacyPage() {
  return (
    <section className="py-24 min-h-screen flex items-center justify-center">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted mb-4">
          Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use Astro AI.
        </p>
        <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
        <p className="text-muted mb-3">
          • Personal data you provide when signing up.<br/>
          • Interaction data from the AI chat and voice sessions stored securely for personalization.<br/>
          
        </p>
       
        <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
        <p className="text-muted mb-3">
          We employ industry‑standard encryption, secure servers, and regular audits to protect your data. Access is limited to authorized personnel only.
        </p>
        
        <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
        <p className="text-muted">
          For any privacy‑related questions, please email us at <a href="mailto:karankumar8239@gmail.com" className="text-primary underline">karankumar8239@gmail.com</a>.
        </p>
      </div>
    </section>
  );
}
