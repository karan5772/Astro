"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import "../astraeus.css";

export default function VoicePage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add('astraeus-active');
    return () => {
      document.body.classList.remove('astraeus-active');
    };
  }, []);

  // Safety check to ensure non-pro users can't easily stay here
  useEffect(() => {
    if (isLoaded && user) {
      const checkProStatus = () => {
        fetch("/api/user")
          .then((res) => res.json())
          .then((data) => {
            if (!data || !data.isPro) {
              stopSession();
              toast.error(
                "Your cosmic session has expired. Please recharge to continue.",
              );
              router.push("/pricing");
            } else if (data.proUntil) {
              const timeRemaining =
                new Date(data.proUntil).getTime() - Date.now();
              if (timeRemaining <= 0) {
                stopSession();
                toast.error(
                  "Your cosmic session has expired. Please recharge to continue.",
                );
                router.push("/pricing");
              }
            }
          })
          .catch(console.error);
      };

      // Check immediately
      checkProStatus();

      // And check every 60 seconds
      const interval = setInterval(checkProStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, user, router]);

  const startSession = async () => {
    try {
      setIsLoading(true);
      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatus("Aligning cosmic frequencies...");
      const tokenResponse = await fetch("/api/realtime-session");
      if (!tokenResponse.ok)
        throw new Error("Failed to authenticate realtime session");

      const data = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;

      setStatus("Opening portal...");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Play remote audio from AI
      audioElRef.current = new Audio();
      audioElRef.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      // Add local microphone audio to the connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "response.output_text.delta") {
          console.log("AI Text:", msg.delta);
        }
        if (msg.type === "response.output_audio_transcript.delta") {
          console.log("AI Audio Transcript:", msg.delta);
        }
        if (msg.type === "response.audio_transcript.done") {
          console.log("AI Full Transcript:", msg.transcript);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("WebRTC Error:", errorText);
        throw new Error(
          `Failed to connect to the cosmos: ${sdpResponse.status}`,
        );
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setStatus("Connected! The stars are listening...");
      setIsSessionActive(true);

      // Trigger the AI to speak first upon connection
      dc.onopen = () => {
        const event = {
          type: "response.create",
        };
        dc.send(JSON.stringify(event));
      };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setStatus("Error: " + errMsg);
      console.error(e);
      stopSession();
    } finally {
      setIsLoading(false);
    }
  };

  function stopSession() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    setIsSessionActive(false);
    setStatus("Session ended. The portal is closed.");
  }

  return (
    <div className="theme-astraeus min-h-screen">
      <Navbar variant="voice" />
      <main className="voice-container fade-in relative z-10">
        <div
          className="glow-orb glow-orb-1"
          style={{
            top: "20%",
            left: "10%",
          }}
        ></div>
        <div
          className="glow-orb glow-orb-2"
          style={{
            bottom: "20%",
            right: "10%",
          }}
        ></div>

        <div
          style={{
            textAlign: "center",
            margin: "auto",
            padding: "clamp(1rem, 5vw, 2rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              width: "clamp(140px, 30vw, 180px)",
              height: "clamp(140px, 30vw, 180px)",
              borderRadius: "50%",
              background: isSessionActive
                ? "rgba(233, 195, 73, 0.15)"
                : "rgba(255, 255, 255, 0.02)",
              border: `2px solid ${isSessionActive ? "rgba(233, 195, 73, 0.8)" : "rgba(255, 255, 255, 0.1)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "clamp(1.5rem, 5vw, 3rem)",
              transition: "all 0.4s ease",
              boxShadow: isSessionActive
                ? "0 0 50px rgba(233, 195, 73, 0.5)"
                : "0 0 30px rgba(0, 0, 0, 0.3)",
              animation: isSessionActive ? "pulse 2s infinite" : "none",
            }}
          >
            {isLoading ? (
              <Loader2 size={64} className="spin" color="#e9c349" />
            ) : isSessionActive ? (
              <Mic size={64} color="#e9c349" />
            ) : (
              <Mic size={64} className="text-on-surface-variant" style={{ color: "var(--on-surface-variant)" }} />
            )}
          </div>

          <h2
            className="text-gradient font-display"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
              marginBottom: "1rem",
              background: "linear-gradient(135deg, var(--on-bg-color) 20%, var(--tertiary) 80%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
            }}
          >
            Deep Vocal Connection
          </h2>

          <p
            className="text-muted"
            style={{
              fontSize: "1.2rem",
              maxWidth: "500px",
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            {isSessionActive
              ? "Your cosmic guide is listening. Speak naturally and feel heard."
              : "Close your eyes, relax your mind, and prepare to connect with the universe."}
          </p>

          <div
            style={{
              marginBottom: "3rem",
              minHeight: "30px",
              color: status.startsWith("Error")
                ? "var(--error)"
                : status.includes("Connected")
                  ? "var(--tertiary)"
                  : isLoading
                    ? "var(--secondary)"
                    : "var(--primary)",
              fontWeight: "600",
              fontSize: "1.1rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {status}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {!isSessionActive ? (
              <button
                onClick={startSession}
                className="glow-button-primary cursor-pointer"
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  padding: "1.2rem",
                  fontSize: "1rem",
                  letterSpacing: "0.1em",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Start Healing Session"}
              </button>
            ) : (
              <button
                onClick={stopSession}
                className="cursor-pointer"
                style={{
                  background: "rgba(255, 180, 171, 0.1)",
                  border: "1px solid rgba(255, 180, 171, 0.4)",
                  color: "var(--error)",
                  borderRadius: "9999px",
                  width: "100%",
                  maxWidth: "300px",
                  padding: "1.2rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 15px rgba(255, 180, 171, 0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                <Square
                  size={16}
                  style={{ display: "inline", marginRight: "8px" }}
                />
                End Session
              </button>
            )}
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(233, 195, 73, 0.4); }
              70% { box-shadow: 0 0 0 30px rgba(233, 195, 73, 0); }
              100% { box-shadow: 0 0 0 0 rgba(233, 195, 73, 0); }
            }
            .spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `,
            }}
          />
        </div>
      </main>
    </div>
  );
}
