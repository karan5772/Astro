"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Compass, Activity, Shield, HardDrive, Wifi } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import "../astraeus.css";

export default function VoicePage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSessionActive) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [isSessionActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
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
    <div className="theme-astraeus sidebar-layout min-h-screen">
      <Sidebar />
      
      <main className="page-main voice-container fade-in relative z-10">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>

        <div className="astral-container" style={{ maxWidth: '1280px' }}>
          <div className="page-heading" style={{ marginBottom: '1.5rem' }}>
            <p className="section-kicker">Voice session</p>
            <h1 className="page-title" style={{ maxWidth: '12ch' }}>A cleaner control room for live readings.</h1>
            <p className="page-lead" style={{ maxWidth: '48rem' }}>
              The voice page now opens with a lighter shell, clearer telemetry, and more intentional session controls.
            </p>
          </div>

          <div className="chat-status-strip">
            <div className="chart-meta-chip">
              <span className="metric-label">Mode</span>
              <strong>Voice room</strong>
            </div>
            <div className="chart-meta-chip">
              <span className="metric-label">Status</span>
              <strong>{isSessionActive ? 'Live' : 'Idle'}</strong>
            </div>
            <div className="chart-meta-chip">
              <span className="metric-label">Controls</span>
              <strong>{isLoading ? 'Connecting...' : 'Ready'}</strong>
            </div>
          </div>

        <div className="voice-shell">
          <motion.section
            className="voice-stage glass-panel shared-surface"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="voice-stage-header">
              <div>
                <p className="section-kicker">Voice room</p>
                <h2 className="voice-title">
                  One button, one job: start the live reading.
                </h2>
                <p className="voice-copy">
                  Keep the screen quiet, keep the controls obvious, and let the session do the talking.
                </p>
              </div>

              <div className="voice-status-strip">
                <span className="voice-status-chip">
                  <Activity size={12} />
                  {isSessionActive ? 'Live' : isLoading ? 'Connecting' : 'Idle'}
                </span>
                <span className="voice-status-chip">
                  <Shield size={12} />
                  {isSessionActive ? 'Secure stream' : 'Microphone ready'}
                </span>
                <span className="voice-status-chip">
                  <Wifi size={12} />
                  {formatTime(elapsedTime)}
                </span>
              </div>
            </div>

            <div className={`voice-orb ${isSessionActive ? 'active' : ''}`}>
              {isLoading ? (
                <Loader2 size={42} className="spin text-primary" />
              ) : isSessionActive ? (
                <Mic size={42} className="text-primary animate-pulse" />
              ) : (
                <Mic size={42} style={{ color: 'var(--on-surface-variant)' }} />
              )}
            </div>

            <div className="voice-feedback">
              <span className="voice-feedback-label">Status</span>
              <p>{status}</p>
            </div>

            <div id="voice-control" className="voice-actions">
              {!isSessionActive ? (
                <button
                  onClick={startSession}
                  className="glow-button-primary cursor-pointer"
                  style={{ width: '100%', padding: '1rem', fontSize: '13px' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Start Voice Session'}
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  className="glow-button-secondary cursor-pointer"
                  style={{ width: '100%', padding: '1rem', fontSize: '13px' }}
                >
                  <Square size={14} style={{ marginRight: '8px' }} />
                  End Session
                </button>
              )}
            </div>
          </motion.section>
        </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
  );
}
