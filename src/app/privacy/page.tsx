"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  useEffect(() => {
    // Body styling is handled via Tailwind and globals.css
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col justify-between selection:bg-primary/30 selection:text-white">
      <Navbar variant="legal" />
      <main className="relative z-10 pt-32 pb-16 max-w-[1280px] mx-auto px-6 flex-1 w-full">
        <div className="flex flex-col gap-3 mb-10">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Your privacy is important to us. This policy explains what we collect, how we use it, and how we protect it when you use Astraeus.
          </p>
        </div>

        <section className="p-8 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem" }}>Information We Collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-white/50">
            <li>Personal data you provide when signing up, such as name and email address.</li>
            <li>Interaction data from chat and voice sessions stored securely for personalization.</li>
          </ul>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Data Security</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            We use encryption, secure servers, and routine checks to help protect your data. Access is limited to authorized personnel only.
          </p>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Contact Us</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            For privacy questions, email{" "}
            <a href="mailto:karankumar8239@gmail.com" className="text-primary hover:underline">karankumar8239@gmail.com</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
