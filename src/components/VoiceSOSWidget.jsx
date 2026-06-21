import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const WAKE_WORDS = [
  // Single Keywords
  'help', 'sos', 'emergency', 'save me', 'danger', 'rescue', 'protect me', 'safe shield', 'sheshield', 'alert', 'unsafe', 'danger alert', 'panic', 'assist',
  // Short Sentences
  'help me', 'i need help', 'please help me', 'emergency help', "i'm in danger", 'im in danger', 'i am in danger', 'send help', 'call police', 'activate sos', 'start emergency mode', 'sheshield help', 'sheshield activate', 'safe mode on', 'i am unsafe', 'im unsafe', 'someone is following me', 'i need immediate help',
  // Secret / Discreet Phrases
  "i'm not feeling safe", 'im not feeling safe', 'i am not feeling safe', 'please check my location', 'red alert', 'code red', 'safety mode', 'contact emergency', 'notify my family', 'start tracking', 'send my location',
  // Telugu Keywords
  'kapadandi', 'nannu kapadandi', 'sahayam kavali', 'pramadam', 'rakshinchandi', 'police ki call cheyyi', 'nenu danger lo unnanu', 'naku help kavali', 'sos activate cheyyi'
];

const VoiceSOSWidget = () => {
  const [isListening, setIsListening] = useState(true);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [lastHeard, setLastHeard] = useState('');
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(isListening);
  const isMountedRef = useRef(true);
  const isStoppingForSOSRef = useRef(false);

  // Keep track of component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep ref in sync to avoid stale closures inside recognition events
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const triggerSOS = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude.toFixed(4);
            const lon = position.coords.longitude.toFixed(4);
            const result = await api.post('/sos/activate', { lat, lon });
            
            // Dispatch event to sync UI components (e.g. SOSCenterPage)
            window.dispatchEvent(new CustomEvent('sos-status-changed', {
              detail: { active: true, lat, lon, message: result.message || 'SOS ACTIVATED VIA VOICE COMMAND' }
            }));
          } catch (err) {
            console.error('Failed to trigger SOS:', err);
          }
        },
        async (error) => {
          try {
            const result = await api.post('/sos/activate', { lat: 0, lon: 0 });
            
            window.dispatchEvent(new CustomEvent('sos-status-changed', {
              detail: { active: true, lat: '0', lon: '0', message: result.message || 'SOS ACTIVATED VIA VOICE COMMAND (Location unavailable)' }
            }));
          } catch (err) {
            console.error('Failed to trigger SOS:', err);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      api.post('/sos/activate', { lat: 0, lon: 0 })
         .then((result) => {
            window.dispatchEvent(new CustomEvent('sos-status-changed', {
              detail: { active: true, lat: '0', lon: '0', message: result.message || 'SOS ACTIVATED VIA VOICE COMMAND' }
            }));
         })
         .catch(err => console.error('Failed to trigger SOS:', err));
    }
  }, []);

  // Initialize SpeechRecognition exactly once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Loop from 0 to capture wake words split across event index boundaries
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const transcript = (finalTranscript + interimTranscript).toLowerCase();
      const cleanTranscript = transcript.replace(/[.,!?]/g, '').trim();
      
      if (cleanTranscript) {
        setLastHeard(cleanTranscript);
      }
      
      const wakeWordDetected = WAKE_WORDS.some(word => cleanTranscript.includes(word));
      
      if (wakeWordDetected) {
        console.log('🗣️ Wake word detected!', cleanTranscript);
        triggerSOS();
        
        // Use a cooldown ref to prevent onend from triggering an immediate restart
        isStoppingForSOSRef.current = true;
        recognition.stop();
        
        setTimeout(() => {
          isStoppingForSOSRef.current = false;
          if (isMountedRef.current && isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart speech recognition after cooldown:', e);
            }
          }
        }, 3000);
      }
    };

    recognition.onerror = (event) => {
      console.warn('🎙️ Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
        setError(
          event.error === 'not-allowed' 
            ? 'Microphone access denied' 
            : `Speech recognition error: ${event.error}`
        );
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to be listening and not in the middle of an SOS cooldown
      if (isMountedRef.current && isListeningRef.current && !isStoppingForSOSRef.current) {
        setTimeout(() => {
          if (isMountedRef.current && isListeningRef.current && !isStoppingForSOSRef.current) {
            try {
              recognition.start();
            } catch (e) {
              // Ignore "already started" errors
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [triggerSOS]);

  // Handle start/stop based on React state
  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Ignore "already started" errors
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [isListening]);

  const toggleListening = () => {
    if (!supported) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    setError(null);
    setLastHeard('');
    const nextListening = !isListening;
    setIsListening(nextListening);
    isListeningRef.current = nextListening;
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
      {isListening && (
        <div className="flex flex-col items-end gap-1">
          <div className="bg-white/90 backdrop-blur border border-rose-200 shadow-lg px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-600">Safe Walk Mode Active (Listening)</span>
          </div>
          {lastHeard && (
            <div className="bg-white/80 backdrop-blur border border-slate-200 shadow px-3 py-1.5 rounded-lg text-[10px] text-slate-500 max-w-[200px] truncate">
              Heard: "{lastHeard}"
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="bg-white/90 backdrop-blur border border-rose-200 shadow-lg px-4 py-2 rounded-xl text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      <button
        onClick={toggleListening}
        title="Safe Walk Mode (Voice SOS)"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isListening 
            ? 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse scale-110' 
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default VoiceSOSWidget;
