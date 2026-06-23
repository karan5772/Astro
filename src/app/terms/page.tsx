"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../astraeus.css";

export default function TermsPage() {
  useEffect(() => {
    document.body.classList.add("astraeus-active");
    return () => {
      document.body.classList.remove("astraeus-active");
    };
  }, []);

  return (
    <div className="theme-astraeus page-shell">
      <Navbar variant="legal" />
      <main className="page-main astral-container">
        <div className="page-heading">
          <p className="section-kicker">Legal</p>
          <h1 className="page-title">Terms &amp; Conditions</h1>
          <p className="page-lead">
            By using Astraeus, you agree to the terms below. Please read them carefully before purchasing or using the service.
          </p>
        </div>

        <section className="glass-panel page-card shared-surface">
          <h2 className="section-title" style={{ fontSize: "1.5rem" }}>1. Service Description</h2>
          <p className="page-lead">
            Astraeus provides AI-generated astrological insights, chat, and voice sessions. The service is offered on a subscription basis.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>2. User Accounts</h2>
          <p className="page-lead">
            You must create an account and provide accurate information. You are responsible for keeping your login details secure.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>3. Payments &amp; Billing</h2>
          <p className="page-lead">
            Subscriptions are billed in advance on a recurring basis. All fees are non-refundable except as outlined in the cancellation policy.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>4. Prohibited Use</h2>
          <p className="page-lead">
            You may not misuse the service, reverse-engineer it, or attempt to access underlying systems in unauthorized ways.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>5. Limitation of Liability</h2>
          <p className="page-lead">
            Astraeus is provided as is. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>6. Changes to Terms</h2>
          <p className="page-lead">
            We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
