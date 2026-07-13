import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface VoicePlayerProps {
  audioUrl: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((e) => {
        console.error('Audio play failed:', e);
      });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="glass-panel"
      style={{
        width: '100%',
        maxWidth: '500px',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: 'var(--shadow-md)',
        marginTop: '1.5rem',
        animation: 'fadeInUp 0.6s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Animated music disk/note representation */}
        <div 
          className="flex-center"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            animation: isPlaying ? 'rotate 4s linear infinite' : 'none'
          }}
        >
          <Music size={18} />
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-title)' }}>
            Sender's Voice Note
          </h4>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            {isPlaying ? 'Playing voice message...' : 'Tap play to listen'}
          </span>
        </div>

        {/* Pulsing Visualizer Bars (pure CSS animations) */}
        {isPlaying && (
          <div 
            style={{ 
              display: 'flex', 
              gap: '3px', 
              alignItems: 'flex-end', 
              height: '18px', 
              marginLeft: 'auto',
              marginRight: '0.5rem'
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '1.5px',
                  height: '100%',
                  animation: `pulse-soft ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="btn btn-primary btn-icon-only flex-center"
          style={{
            width: '44px',
            height: '44px',
            padding: 0,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            flexShrink: 0
          }}
        >
          {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: '3px' }} />}
        </button>

        {/* Custom Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.25rem' }}>
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            style={{
              width: '100%',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Mute Toggle */}
        <button
          onClick={toggleMute}
          className="btn btn-secondary btn-icon-only flex-center"
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            borderRadius: '50%',
            flexShrink: 0
          }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Embedded rotating keyframe style */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
