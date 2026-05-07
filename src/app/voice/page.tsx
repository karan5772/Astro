"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function VoicePage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Safety check to ensure non-pro users can't easily stay here
  useEffect(() => {
    if (isLoaded && user) {
      const checkProStatus = () => {
        fetch('/api/user')
          .then(res => res.json())
          .then(data => {
            if (!data || !data.isPro) {
              stopSession();
              toast.error("Your cosmic session has expired. Please recharge to continue.");
              router.push('/pricing');
            } else if (data.proUntil) {
              const timeRemaining = new Date(data.proUntil).getTime() - Date.now();
              if (timeRemaining <= 0) {
                stopSession();
                toast.error("Your cosmic session has expired. Please recharge to continue.");
                router.push('/pricing');
              }
            }
          })
          .catch(console.error);
      };

      // Check immediately
      checkProStatus();

      // And check every 30 seconds
      const interval = setInterval(checkProStatus, 30000);
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
      if (!tokenResponse.ok) throw new Error("Failed to authenticate realtime session");
      
      const data = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;

      setStatus("Opening portal...");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Play remote audio from AI
      audioElRef.current = new Audio();
      audioElRef.current.autoplay = true;
      pc.ontrack = e => {
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      // Add local microphone audio to the connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        // Logs event messages like transcriptions if needed
        const msg = JSON.parse(e.data);
        if (msg.type === "response.audio_transcript.done") {
          console.log("AI:", msg.transcript);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        }
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("WebRTC Error:", errorText);
        throw new Error(`Failed to connect to the cosmos: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text()
      };
      await pc.setRemoteDescription(answer);

      setStatus("Connected! The stars are listening...");
      setIsSessionActive(true);

      // Trigger the AI to speak first upon connection
      dc.onopen = () => {
         const event = {
           type: "response.create",
           response: {
             instructions: "Greet the user warmly by saying 'Welcome, traveler. I am Astro AI. What guidance do you seek from the stars today?'"
           }
         };
         dc.send(JSON.stringify(event));
      };

    } catch (e: any) {
      setStatus("Error: " + e.message);
      console.error(e);
      stopSession();
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    setIsSessionActive(false);
    setStatus("Session ended. The portal is closed.");
  };

  return (
    <>
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link href="/dashboard" className="nav-brand text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Mic className="text-yellow-500" size={20} color="#f39c12" />
            <span className="font-semibold text-yellow-500" style={{ color: '#f39c12' }}>PRO TIER</span>
          </div>
        </div>
      </nav>

      <main className="container fade-in relative z-10" style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%', background: '#f39c12', opacity: 0.2 }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%', background: '#d35400', opacity: 0.2 }}></div>

        <div className="text-center mb-12">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>
            <span className="text-gradient font-serif italic" style={{ background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live Voice Reading</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Speak directly with your AI astrologer in real-time. No typing required. The cosmic connection flows instantly.
          </p>
        </div>

        <div className="glass-card text-center relative" style={{ width: '100%', maxWidth: '600px', padding: '3rem 2rem', border: isSessionActive ? '1px solid rgba(243, 156, 18, 0.5)' : '1px solid var(--card-border)', boxShadow: isSessionActive ? '0 0 40px rgba(243, 156, 18, 0.2)' : 'none' }}>
          <div 
            style={{ 
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              background: isSessionActive ? 'rgba(243, 156, 18, 0.2)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${isSessionActive ? '#f39c12' : 'var(--card-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2.5rem',
              transition: 'all 0.3s ease',
              boxShadow: isSessionActive ? '0 0 30px rgba(243, 156, 18, 0.4)' : 'none',
              animation: isSessionActive ? 'pulse 2s infinite' : 'none'
            }}
          >
            {isLoading ? (
              <Loader2 size={48} className="spin" color="#f39c12" />
            ) : isSessionActive ? (
              <Mic size={48} color="#f39c12" />
            ) : (
              <Mic size={48} className="text-muted" />
            )}
          </div>

          <div style={{ marginBottom: '2.5rem', minHeight: '30px', color: isSessionActive ? '#f39c12' : 'var(--muted)', fontWeight: isSessionActive ? '600' : '500', fontSize: '1.1rem' }}>
            {status}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {!isSessionActive ? (
              <button 
                onClick={startSession} 
                className="btn btn-primary" 
                style={{ background: 'linear-gradient(to right, #f39c12, #d35400)', border: 'none', width: '100%', maxWidth: '250px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Start Session'}
              </button>
            ) : (
              <button 
                onClick={stopSession} 
                className="btn btn-outline" 
                style={{ borderColor: '#ff4757', color: '#ff4757', width: '100%', maxWidth: '250px', background: 'rgba(255, 71, 87, 0.1)' }}
              >
                <Square size={16} style={{ display: 'inline', marginRight: '8px' }} />
                End Session
              </button>
            )}
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.4); }
              70% { box-shadow: 0 0 0 20px rgba(243, 156, 18, 0); }
              100% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0); }
            }
            .spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `}} />
        </div>

      </main>
    </>
  );
}
