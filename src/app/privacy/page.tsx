"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../astraeus.css";

export default function PrivacyPage() {
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
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-lead">
            Your privacy is important to us. This policy explains what we collect, how we use it, and how we protect it when you use Astraeus.
          </p>
        </div>

        <section className="glass-panel page-card shared-surface">
          <h2 className="section-title" style={{ fontSize: "1.5rem" }}>Information We Collect</h2>
          <ul className="legal-list">
            <li>Personal data you provide when signing up, such as name and email address.</li>
            <li>Interaction data from chat and voice sessions stored securely for personalization.</li>
          </ul>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Data Security</h2>
          <p className="page-lead">
            We use encryption, secure servers, and routine checks to help protect your data. Access is limited to authorized personnel only.
          </p>

          <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Contact Us</h2>
          <p className="page-lead">
            For privacy questions, email{" "}
            <a href="mailto:karankumar8239@gmail.com">karankumar8239@gmail.com</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
