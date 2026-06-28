"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Activity, Shield, Wifi } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";

// ── Vedic Rashi (element glow) ────────────────────────────────────────────────

type RashiData = { name: string; elementColor: string; glowColor: string };

const VEDIC_RASHIS: RashiData[] = [
  { name: 'Mesha',     elementColor: '#ff6b35', glowColor: 'rgba(255,107,53,0.22)'  },
  { name: 'Vrishabha', elementColor: '#51cf66', glowColor: 'rgba(81,207,102,0.22)' },
  { name: 'Mithuna',   elementColor: '#74c0fc', glowColor: 'rgba(116,192,252,0.22)' },
  { name: 'Karka',     elementColor: '#4dabf7', glowColor: 'rgba(77,171,247,0.22)'  },
  { name: 'Simha',     elementColor: '#ffd43b', glowColor: 'rgba(255,212,59,0.22)'  },
  { name: 'Kanya',     elementColor: '#63e6be', glowColor: 'rgba(99,230,190,0.22)'  },
  { name: 'Tula',      elementColor: '#f783ac', glowColor: 'rgba(247,131,172,0.22)' },
  { name: 'Vrischika', elementColor: '#e64980', glowColor: 'rgba(230,73,128,0.22)'  },
  { name: 'Dhanu',     elementColor: '#ff8c00', glowColor: 'rgba(255,140,0,0.22)'   },
  { name: 'Makara',    elementColor: '#868e96', glowColor: 'rgba(134,142,150,0.22)' },
  { name: 'Kumbha',    elementColor: '#74c0fc', glowColor: 'rgba(116,192,252,0.22)' },
  { name: 'Meena',     elementColor: '#cc5de8', glowColor: 'rgba(204,93,232,0.22)'  },
];

const RASHI_RANGES: [number, number, number, number, number][] = [
  [1,1,1,14,8],[1,15,2,12,9],[2,13,3,14,10],
  [3,15,4,13,11],[4,14,5,14,0],[5,15,6,14,1],
  [6,15,7,16,2],[7,17,8,16,3],[8,17,9,16,4],
  [9,17,10,17,5],[10,18,11,16,6],[11,17,12,15,7],
  [12,16,12,31,8],
];

function getVedicRashi(dateStr: string | null): RashiData | null {
  if (!dateStr) return null;
  const [, ms, ds] = dateStr.split('-');
  const month = parseInt(ms, 10), day = parseInt(ds, 10);
  for (const [sm, sd, em, ed, idx] of RASHI_RANGES) {
    if ((month > sm || (month === sm && day >= sd)) && (month < em || (month === em && day <= ed)))
      return VEDIC_RASHIS[idx];
  }
  return VEDIC_RASHIS[8];
}

// ── Animated Waveform ─────────────────────────────────────────────────────────

function AnimatedWaveform({ color }: { color: string }) {
  const bars = [26, 46, 62, 36, 58, 32, 50, 22, 54];
  return (
    <div className="flex items-end gap-[4px]" style={{ height: 56 }}>
      {bars.map((maxH, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-full"
          style={{ backgroundColor: color, minHeight: 5 }}
          animate={{
            height: [
              `${maxH * 0.22}px`,
              `${maxH}px`,
              `${maxH * 0.4}px`,
              `${maxH * 0.82}px`,
              `${maxH * 0.22}px`,
            ],
          }}
          transition={{
            duration: 0.72 + i * 0.08,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.065,
          }}
        />
      ))}
    </div>
  );
}

// ── Session Gauge ─────────────────────────────────────────────────────────────

function SessionGauge({
  remainingSecs,
  totalSecs,
  isActive,
  isLoading,
  rashiColor,
}: {
  remainingSecs: number;
  totalSecs: number;
  isActive: boolean;
  isLoading: boolean;
  rashiColor: string | null;
}) {
  const pct = totalSecs > 0 ? Math.min(1, remainingSecs / totalSecs) : 0;
  const R = 76, circ = 2 * Math.PI * R;
  const offset = circ * (1 - pct);
  const gaugeStroke = pct > 0.5 ? '#51cf66' : pct > 0.2 ? '#ffd43b' : '#ff6b6b';
  const activeColor = isActive && rashiColor ? rashiColor : gaugeStroke;
  const mins = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
  const secs = (remainingSecs % 60).toString().padStart(2, '0');

  return (
    <div className="relative flex items-center justify-center" style={{ width: 192, height: 192 }}>
      {/* Ambient glow behind ring when active */}
      {isActive && rashiColor && (
        <div
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
          style={{ backgroundColor: rashiColor, opacity: 0.22 }}
        />
      )}

      <svg width="192" height="192" viewBox="0 0 192 192" className="absolute inset-0">
        {/* Track */}
        <circle cx="96" cy="96" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        {/* Progress arc */}
        <circle
          cx="96" cy="96" r={R}
          fill="none"
          stroke={activeColor}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 96 96)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.6s ease' }}
        />
      </svg>

      {/* Center */}
      <div className="relative flex flex-col items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 size={38} className="animate-spin text-primary" />
        ) : isActive ? (
          <>
            <AnimatedWaveform color={activeColor} />
            <span className="text-foreground/50 font-mono text-[11px] tabular-nums">{mins}:{secs}</span>
          </>
        ) : (
          <>
            <Mic size={38} className="text-foreground/25" />
            <span className="text-foreground/25 font-mono text-[11px] tabular-nums">{mins}:{secs}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [voiceBalanceInSeconds, setVoiceBalanceInSeconds] = useState(0);
  const [totalBalanceInSeconds, setTotalBalanceInSeconds] = useState(0);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const rashi = getVedicRashi(birthDate);

  useEffect(() => {
    const handleSync = () => {
      if (typeof window !== 'undefined') {
        setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
      }
    };
    handleSync();
    window.addEventListener('sidebar-collapse-change', handleSync);
    return () => window.removeEventListener('sidebar-collapse-change', handleSync);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSessionActive) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
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
    return () => { document.body.classList.remove('astraeus-active'); };
  }, []);

  // Access check — blocks the start button until resolved
  useEffect(() => {
    if (isLoaded && user) {
      const checkProStatus = () => {
        fetch("/api/user")
          .then((res) => res.json())
          .then((data) => {
            if (!data || !data.isPro || (data.voiceBalanceInSeconds || 0) <= 0) {
              stopSession();
              setShowUpgradeModal(true);
            } else {
              setVoiceBalanceInSeconds(data.voiceBalanceInSeconds);
            }
          })
          .catch(console.error);
      };

      // Initial load — also capture birthDate and set total for gauge
      fetch("/api/user")
        .then((res) => res.json())
        .then((data) => {
          if (!data || !data.isPro || (data.voiceBalanceInSeconds || 0) <= 0) {
            setShowUpgradeModal(true);
          } else {
            const bal = data.voiceBalanceInSeconds;
            setVoiceBalanceInSeconds(bal);
            setTotalBalanceInSeconds(bal);
            setBirthDate(data.birthDate ?? null);
          }
        })
        .catch(console.error)
        .finally(() => setCheckingAccess(false));

      // Periodic re-check every 60s
      const interval = setInterval(checkProStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, user]);

  // Local countdown while session is live
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isSessionActive && voiceBalanceInSeconds > 0) {
      t = setInterval(() => {
        setVoiceBalanceInSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isSessionActive, voiceBalanceInSeconds]);

  // Heartbeat — server-side balance sync every 10s
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isSessionActive) {
      t = setInterval(async () => {
        try {
          const res = await fetch('/api/user/voice-heartbeat', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (!data.success || data.voiceBalanceInSeconds <= 0) {
              stopSession();
              setShowUpgradeModal(true);
            } else {
              setVoiceBalanceInSeconds(data.voiceBalanceInSeconds);
            }
          }
        } catch (e) {
          console.error('Voice heartbeat error:', e);
        }
      }, 10000);
    }
    return () => clearInterval(t);
  }, [isSessionActive]);

  const startSession = async () => {
    try {
      setIsLoading(true);
      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatus("Aligning cosmic frequencies...");
      const tokenResponse = await fetch("/api/realtime-session");
      if (!tokenResponse.ok) throw new Error("Failed to authenticate realtime session");

      const data = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;

      setStatus("Opening portal...");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      audioElRef.current = new Audio();
      audioElRef.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElRef.current) audioElRef.current.srcObject = e.streams[0];
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "response.audio_transcript.done") {
          console.log("AI:", msg.transcript);
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
        throw new Error(`Failed to connect to the cosmos: ${sdpResponse.status}`);
      }

      const answer = { type: "answer" as RTCSdpType, sdp: await sdpResponse.text() };
      await pc.setRemoteDescription(answer);

      setStatus("Connected! The stars are listening...");
      setIsSessionActive(true);

      dc.onopen = () => dc.send(JSON.stringify({ type: "response.create" }));
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
    if (audioElRef.current) audioElRef.current.srcObject = null;
    setIsSessionActive(false);
    setStatus("Session ended. The portal is closed.");
  }

  const glowStyle = isSessionActive && rashi
    ? { boxShadow: `0 0 80px ${rashi.glowColor}, 0 25px 50px -12px rgba(0,0,0,0.5)` }
    : {};

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-1">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L19.09 12.26L28 13.27L21.5 19.64L23.18 28L16 24L8.82 28L10.5 19.64L4 13.27L12.91 12.26L16 4Z" fill="currentColor" className="text-primary" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Your voice balance has run out</h2>
            <p className="text-sm text-foreground/55 leading-relaxed">
              Recharge to keep talking to the stars — pick a plan that gives you more voice minutes and unlimited cosmic guidance.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full py-3 rounded-xl bg-primary text-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              View upgrade plans
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="text-xs text-foreground/35 hover:text-foreground/60 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <Sidebar />

      <main className={`flex-1 pt-24 lg:pt-8 pb-16 px-4 md:px-12 flex flex-col items-center overflow-y-auto w-full relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>

        {/* Ambient glow orbs — shift to rashi color when active */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none transition-colors duration-700"
          style={{ top: '15%', left: '10%', backgroundColor: isSessionActive && rashi ? rashi.glowColor : 'rgba(109,93,251,0.06)' }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none transition-colors duration-700"
          style={{ bottom: '15%', right: '10%', backgroundColor: isSessionActive && rashi ? rashi.glowColor : 'rgba(157,78,221,0.05)' }}
        />

        <div className="w-full max-w-[1280px] my-auto">
          <div className="flex justify-center w-full pb-12">
            <motion.section
              className="w-full max-w-[700px] bg-secondary/40 backdrop-blur-lg border border-border rounded-2xl p-5 sm:p-8 relative flex flex-col items-center gap-8 transition-shadow duration-700"
              style={glowStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {/* Header */}
              <div className="w-full border-b border-border pb-6 flex flex-col gap-4 text-center md:text-left">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-foreground/40 mb-2">Voice room</p>
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    One button, one job: start the live reading.
                  </h2>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    Keep the screen quiet, keep the controls obvious, and let the session do the talking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start mt-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-border rounded-full text-[10px] uppercase tracking-wider font-semibold text-foreground/70">
                    <Activity size={12} className="text-primary" />
                    {isSessionActive ? 'Live' : isLoading ? 'Connecting' : 'Idle'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-border rounded-full text-[10px] uppercase tracking-wider font-semibold text-foreground/70">
                    <Shield size={12} className="text-primary" />
                    {isSessionActive ? 'Secure stream' : 'Microphone ready'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 border border-border rounded-full text-[10px] uppercase tracking-wider font-semibold text-foreground/70">
                    <Wifi size={12} className="text-primary" />
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>

              {/* Session gauge — replaces static mic circle */}
              <SessionGauge
                remainingSecs={voiceBalanceInSeconds}
                totalSecs={totalBalanceInSeconds}
                isActive={isSessionActive}
                isLoading={isLoading}
                rashiColor={rashi?.elementColor ?? null}
              />

              {/* Status */}
              <div className="text-center w-full p-4 bg-background/40 border border-border rounded-xl">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-foreground/40 block mb-1">Status</span>
                <p className="text-sm text-foreground/80 leading-relaxed">{status}</p>
              </div>

              {/* Control button */}
              <div id="voice-control" className="w-full">
                {!isSessionActive ? (
                  <button
                    onClick={startSession}
                    className="w-full text-center py-4 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 bg-gradient-to-r from-primary to-[#4f46e5] text-foreground shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || checkingAccess}
                  >
                    {checkingAccess ? 'Checking access...' : isLoading ? 'Connecting...' : 'Start Voice Session'}
                  </button>
                ) : (
                  <button
                    onClick={stopSession}
                    className="w-full text-center py-4 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 bg-secondary/80 border border-border hover:border-border text-foreground flex items-center justify-center gap-2"
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
