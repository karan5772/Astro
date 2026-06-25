"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  useEffect(() => {
    // Body styling is handled via Tailwind and globals.css
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col justify-between selection:bg-primary/30 selection:text-white">
      <Navbar variant="legal" />
      <main className="relative z-10 pt-32 pb-16 max-w-[1280px] mx-auto px-6 flex-1 w-full">
        <div className="flex flex-col gap-3 mb-10">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Terms &amp; Conditions</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            By using Astraeus, you agree to the terms below. Please read them carefully before purchasing or using the service.
          </p>
        </div>

        <section className="p-8 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem" }}>1. Service Description</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Astraeus provides AI-generated astrological insights, chat, and voice sessions. The service is offered on a subscription basis.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>2. User Accounts</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            You must create an account and provide accurate information. You are responsible for keeping your login details secure.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>3. Payments &amp; Billing</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Subscriptions are billed in advance on a recurring basis. All fees are non-refundable except as outlined in the cancellation policy.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>4. Prohibited Use</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            You may not misuse the service, reverse-engineer it, or attempt to access underlying systems in unauthorized ways.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>5. Limitation of Liability</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Astraeus is provided as is. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>6. Changes to Terms</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
