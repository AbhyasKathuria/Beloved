import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  onAudioReady: (base64Audio: string | null) => void;
  onClearAudio: () => void;
}

type RecordState = 'idle' | 'recording' | 'reviewing';

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioReady,
  onClearAudio,
}) => {
  const [state, setState] = useState<RecordState>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStreams();
      clearInterval(timerRef.current);
    };
  }, []);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    setPermissionError(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);

        // Convert blob to base64 to store in Database
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onAudioReady(base64);
        };
      };

      // Start recording
      mediaRecorder.start();
      setState('recording');
      setDuration(0);

      // Start timer (limit to 30 seconds for storage efficiency)
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionError(true);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      stopStreams();
      setState('reviewing');
    }
  };

  // Play/Pause Recorded Review
  const togglePlayPreview = () => {
    if (!audioRef.current && previewUrl) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Reset / Re-record
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewUrl(null);
    setIsPlaying(false);
    setDuration(0);
    setState('idle');
    onClearAudio();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.4)',
        border: '1px dashed var(--color-border)',
        marginTop: '1rem',
        textAlign: 'left'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>
          Attach a Voice Note 🎙️
        </h4>
        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          Max duration: 30s
        </span>
      </div>

      {permissionError && (
        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.5rem', fontWeight: 500 }}>
          ⚠️ Microphone access was denied or is unavailable. You can still send your bouquet!
        </div>
      )}

      {/* State Machine UI */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          disabled={permissionError}
          className="btn btn-secondary"
          style={{ width: '100%', gap: '0.5rem', justifyContent: 'center' }}
        >
          <Mic size={16} /> Record Voice Message
        </button>
      )}

      {state === 'recording' && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span 
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ef4444',
                display: 'inline-block',
                animation: 'pulse-soft 1.5s infinite'
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b91c1c' }}>
              Recording... {formatTime(duration)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="btn btn-primary"
            style={{ 
              background: '#ef4444', 
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Square size={14} fill="#fff" /> Stop
          </button>
        </div>
      )}

      {state === 'reviewing' && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(var(--color-primary-rgb), 0.05)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={togglePlayPreview}
              className="btn btn-primary btn-icon-only"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: 'var(--color-primary)'
              }}
            >
              {isPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" style={{ marginLeft: '2px' }} />}
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Voice Note Recorded ({formatTime(duration)})
            </span>
          </div>
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-icon-only"
            title="Delete & Re-record"
            style={{ 
              width: '36px', 
              height: '36px', 
              padding: 0,
              color: '#dc2626',
              background: 'rgba(220, 38, 38, 0.05)',
              borderColor: 'rgba(220, 38, 38, 0.1)'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
