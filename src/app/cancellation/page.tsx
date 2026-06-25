"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CancellationPage() {
  useEffect(() => {
    // Body styling is handled via Tailwind and globals.css
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col justify-between selection:bg-primary/30 selection:text-white">
      <Navbar variant="legal" />
      <main className="relative z-10 pt-32 pb-16 max-w-[1280px] mx-auto px-6 flex-1 w-full">
        <div className="flex flex-col gap-3 mb-10">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Cancellation &amp; Refund Policy</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            We want the experience to feel straightforward. If you need to cancel or ask about refunds, the details below explain the current policy.
          </p>
        </div>

        <section className="p-8 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem" }}>Cancellation</h2>
          <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-white/50 mb-6">
            <li>You cannot cancel your subscription at this time. We will notify you when the feature becomes available.</li>
            <li>If you have any questions or concerns, please contact karankumar8239@gmail.com.</li>
          </ul>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Refunds</h2>
          <ul className="list-disc pl-5 flex flex-col gap-3 text-sm text-white/50 mb-6">
            <li>We do not offer refunds at this time. We will notify you when the feature becomes available.</li>
            <li>If you have any questions or concerns, please contact karankumar8239@gmail.com.</li>
          </ul>

          <h2 className="text-white font-semibold text-lg mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Exceptions</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            If you have violated our terms, we reserve the right to deny refunds.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
