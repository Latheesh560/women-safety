import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const WAKE_WORDS = ['help', 'sos', 'danger', 'activate she shield', 'activate sheshield', 'help me'];

const VoiceSOSWidget = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // We want interim results to catch the word faster
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const transcript = (finalTranscript + interimTranscript).toLowerCase();
      
      // Check if any wake word is in the transcript
      const wakeWordDetected = WAKE_WORDS.some(word => transcript.includes(word));
      
      if (wakeWordDetected) {
        console.log('🗣️ Wake word detected!', transcript);
        triggerSOS();
        // Reset transcript to avoid multiple triggers for the same word
        recognition.stop();
        // Restart after a delay if still in listening mode
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch(e) {}
          }
        }, 3000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to be listening
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch(e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const triggerSOS = useCallback(() => {
    // Attempt to get location and trigger SOS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post('/sos/activate', {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            alert('🚨 SOS ACTIVATED VIA VOICE COMMAND 🚨');
          } catch (err) {
            console.error('Failed to trigger SOS:', err);
          }
        },
        async (error) => {
          console.error('Error getting location for Voice SOS', error);
          try {
            await api.post('/sos/activate', { lat: 0, lon: 0 });
            alert('🚨 SOS ACTIVATED VIA VOICE COMMAND (Location unavailable) 🚨');
          } catch (err) {
            console.error('Failed to trigger SOS:', err);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      api.post('/sos/activate', { lat: 0, lon: 0 })
         .then(() => alert('🚨 SOS ACTIVATED VIA VOICE COMMAND 🚨'))
         .catch(err => console.error('Failed to trigger SOS:', err));
    }
  }, []);

  const toggleListening = () => {
    if (!supported) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      setError(null);
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch(e) {
          console.error("Could not start recognition:", e);
        }
      }
    }
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
      {isListening && (
        <div className="bg-white/90 backdrop-blur border border-rose-200 shadow-lg px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-rose-600">Safe Walk Mode Active (Listening)</span>
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
