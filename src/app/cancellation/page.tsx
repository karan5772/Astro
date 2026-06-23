"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../astraeus.css";

export default function CancellationPage() {
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
          <h1 className="page-title">Cancellation &amp; Refund Policy</h1>
          <p className="page-lead">
            We want the experience to feel straightforward. If you need to cancel or ask about refunds, the details below explain the current policy.
          </p>
        </div>

        <section className="glass-panel page-card shared-surface">
          <h2 className="section-title" style={{ fontSize: "1.5rem" }}>Cancellation</h2>
          <ul className="legal-list">
            <li>You cannot cancel your subscription at this time. We will notify you when the feature becomes available.</li>
            <li>If you have any questions or concerns, please contact karankumar8239@gmail.com.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Refunds</h2>
          <ul className="legal-list">
            <li>We do not offer refunds at this time. We will notify you when the feature becomes available.</li>
            <li>If you have any questions or concerns, please contact karankumar8239@gmail.com.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Exceptions</h2>
          <p className="page-lead">
            If you have violated our terms, we reserve the right to deny refunds.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
