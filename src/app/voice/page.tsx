"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Compass, Activity, Shield, HardDrive, Wifi } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";

export default function VoicePage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [voiceBalanceInSeconds, setVoiceBalanceInSeconds] = useState(0);
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
            if (!data || !data.isPro || (data.voiceBalanceInSeconds || 0) <= 0) {
              stopSession();
              toast.error(
                "Your cosmic session has expired. Please recharge to continue.",
              );
              router.push("/pricing");
            } else {
              setVoiceBalanceInSeconds(data.voiceBalanceInSeconds);
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

  // Local second-by-second countdown for premium UI feedback
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (isSessionActive && voiceBalanceInSeconds > 0) {
      countdownTimer = setInterval(() => {
        setVoiceBalanceInSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [isSessionActive, voiceBalanceInSeconds]);

  // Heartbeat signal to server to decrement the actual database balance
  useEffect(() => {
    let heartbeatTimer: NodeJS.Timeout;
    if (isSessionActive) {
      heartbeatTimer = setInterval(async () => {
        try {
          const response = await fetch('/api/user/voice-heartbeat', { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            if (!data.success || data.voiceBalanceInSeconds <= 0) {
              stopSession();
              toast.error("Your voice balance has run out. Please recharge to continue.");
              router.push('/pricing');
            } else {
              setVoiceBalanceInSeconds(data.voiceBalanceInSeconds);
            }
          }
        } catch (e) {
          console.error('Error during voice heartbeat:', e);
        }
      }, 10000); // 10 seconds
    }
    return () => clearInterval(heartbeatTimer);
  }, [isSessionActive, router]);

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
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">
      <Sidebar />
      
      <main className="flex-1 pt-24 lg:pt-8 pb-16 px-4 md:px-12 lg:pl-[300px] flex flex-col items-center overflow-y-auto w-full relative z-10">
        {/* Glow Background Orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

        <div className="w-full max-w-[1280px]">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">Voice session</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">A cleaner control room for live readings.</h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-[580px]">
              The voice page now opens with a lighter shell, clearer telemetry, and more intentional session controls.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap mb-8">
            <div className="px-4 py-2 rounded-full bg-[#18181b]/40 border border-card-border flex items-center gap-2 text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Mode</span>
              <strong className="text-white/80">Voice room</strong>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#18181b]/40 border border-card-border flex items-center gap-2 text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Status</span>
              <strong className="text-white/80">{isSessionActive ? 'Live' : 'Idle'}</strong>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#18181b]/40 border border-card-border flex items-center gap-2 text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Time Remaining</span>
              <strong className="text-white/80">{formatTime(voiceBalanceInSeconds)}</strong>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#18181b]/40 border border-card-border flex items-center gap-2 text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Controls</span>
              <strong className="text-white/80">{isLoading ? 'Connecting...' : 'Ready'}</strong>
            </div>
          </div>

          <div className="flex justify-center w-full pb-12">
            <motion.section
              className="w-full max-w-[700px] bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 shadow-2xl relative flex flex-col items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="w-full border-b border-card-border pb-6 flex flex-col gap-4 text-center md:text-left">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">Voice room</p>
                  <h2 className="text-lg font-bold text-white mb-2">
                    One button, one job: start the live reading.
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Keep the screen quiet, keep the controls obvious, and let the session do the talking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start mt-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-white/5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-white/70">
                    <Activity size={12} className="text-primary" />
                    {isSessionActive ? 'Live' : isLoading ? 'Connecting' : 'Idle'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-white/5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-white/70">
                    <Shield size={12} className="text-primary" />
                    {isSessionActive ? 'Secure stream' : 'Microphone ready'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-white/5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-white/70">
                    <Wifi size={12} className="text-primary" />
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>

              <div className={`w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center relative cursor-pointer hover:bg-primary/15 transition-all shadow-[0_0_50px_rgba(109,93,251,0.15)] ${isSessionActive ? 'border-primary/50 bg-primary/20 animate-pulse shadow-[0_0_80px_rgba(109,93,251,0.35)]' : ''}`}>
                {isLoading ? (
                  <Loader2 size={42} className="animate-spin text-primary" />
                ) : isSessionActive ? (
                  <Mic size={42} className="text-primary animate-pulse" />
                ) : (
                  <Mic size={42} className="text-white/40" />
                )}
              </div>

              <div className="text-center w-full p-4 bg-[#0c0d12]/40 border border-card-border rounded-xl">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-white/40 block mb-1">Status</span>
                <p className="text-sm text-white/80 leading-relaxed">{status}</p>
              </div>

              <div id="voice-control" className="w-full mt-4">
                {!isSessionActive ? (
                  <button
                    onClick={startSession}
                    className="w-full text-center py-4 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 bg-gradient-to-r from-primary to-[#4f46e5] text-white shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)]"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connecting...' : 'Start Voice Session'}
                  </button>
                ) : (
                  <button
                    onClick={stopSession}
                    className="w-full text-center py-4 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 bg-secondary/80 border border-card-border hover:border-white/20 text-white flex items-center justify-center gap-2"
                  >
                    <Square size={14} className="shrink-0" />
                    End Session
                  </button>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
