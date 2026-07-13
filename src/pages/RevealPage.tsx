import React, { useState, useEffect } from 'react';
import { Canvas } from '../components/Canvas';
import type { PlacedFlower } from '../components/Canvas';
import { Envelope } from '../components/Envelope';
import { VoicePlayer } from '../components/VoicePlayer';
import { getBouquet, incrementViewCount } from '../supabaseClient';
import type { Bouquet } from '../supabaseClient';
import { Heart } from 'lucide-react';

interface RevealPageProps {
  giftId: string;
  onNavigateHome: () => void;
}

export const RevealPage: React.FC<RevealPageProps> = ({ giftId, onNavigateHome }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bouquet, setBouquet] = useState<Bouquet | null>(null);
  
  // Controls the sequential blooming animation
  const [visibleFlowers, setVisibleFlowers] = useState<PlacedFlower[]>([]);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [isLetterOpened, setIsLetterOpened] = useState(false);

  useEffect(() => {
    let active = true;
    let intervalId: any = null;
    let timeoutId: any = null;

    const loadGift = async () => {
      try {
        const data = await getBouquet(giftId);
        if (!active) return;

        if (!data) {
          setError('gift_not_found');
          setLoading(false);
          return;
        }

        // Check if expired
        if (data.expires_at && new Date() > new Date(data.expires_at)) {
          setError('gift_expired');
          setLoading(false);
          return;
        }

        // Check if self-destructed (max_views is 1 and it was already viewed)
        if (data.max_views === 1 && data.view_count >= 1) {
          setError('gift_viewed');
          setLoading(false);
          return;
        }

        setBouquet(data);
        
        // Dynamically apply occasion theme styling to the page
        const presetTheme = data.occasion;
        document.body.className = '';
        document.body.classList.add(`theme-${presetTheme}`);

        // Register this view in the database
        await incrementViewCount(giftId);
        if (!active) return;
        setLoading(false);

        // Start the sequential flower blooming sequence
        const allFlowers = data.canvas_data;
        if (allFlowers.length === 0) {
          setShowEnvelope(true);
          return;
        }

        let currentIndex = 0;
        setVisibleFlowers([]); // Clear any stale flowers
        
        intervalId = setInterval(() => {
          if (!active) return;
          
          if (currentIndex < allFlowers.length) {
            const nextFlower = allFlowers[currentIndex];
            if (nextFlower && nextFlower.id && nextFlower.src) {
              setVisibleFlowers((prev) => [...prev, nextFlower]);
            }
            currentIndex++;
          }

          if (currentIndex >= allFlowers.length) {
            if (intervalId) clearInterval(intervalId);
            timeoutId = setTimeout(() => {
              if (active) setShowEnvelope(true);
            }, 800);
          }
        }, 250); // Delay between each flower bloom
      } catch (err) {
        if (active) {
          console.error('Error fetching bouquet:', err);
          setError('fetch_error');
          setLoading(false);
        }
      }
    };

    loadGift();

    // Cleanup: cancel async states, intervals, and timeouts on unmount
    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [giftId]);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div 
          className="glass-panel animate-pulse-soft" 
          style={{ 
            padding: '3rem', 
            borderRadius: 'var(--radius-lg)', 
            textAlign: 'center',
            maxWidth: '400px'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸✨</div>
          <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
            Unwrapping your gift...
          </h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
            Preparing the flowers to bloom
          </p>
        </div>
      </div>
    );
  }

  // Beautiful, privacy-centric error pages
  if (error) {
    let errorTitle = 'A Private Moment';
    let errorDesc = 'This gift link could not be loaded.';
    let errorIcon = '🔒';

    if (error === 'gift_not_found') {
      errorTitle = 'Link Not Found';
      errorDesc = "This link doesn't seem to match any active bouquet. It may have been deleted, or the URL might be incomplete.";
      errorIcon = '🔍';
    } else if (error === 'gift_expired') {
      errorTitle = 'Gift Link Expired';
      errorDesc = 'This bouquet was configured to expire after 30 days. To protect the privacy of the sender and recipient, old files are permanently deleted.';
      errorIcon = '⏳';
    } else if (error === 'gift_viewed') {
      errorTitle = 'Opened & Destroyed';
      errorDesc = 'This love letter was set to "self-destruct after view." The recipient has already opened this link, and it has been permanently erased from our servers.';
      errorIcon = '🔥';
    }

    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div 
          className="glass-panel" 
          style={{ 
            padding: '3rem 2.5rem', 
            borderRadius: 'var(--radius-lg)', 
            textAlign: 'center',
            maxWidth: '450px',
            border: '1px solid rgba(225, 29, 72, 0.1)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>{errorIcon}</div>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {errorTitle}
          </h2>
          <p style={{ opacity: 0.8, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {errorDesc}
          </p>
          <button onClick={onNavigateHome} className="btn btn-primary" style={{ width: '100%' }}>
            Build a New Bouquet 🌸
          </button>
        </div>
      </div>
    );
  }

  if (!bouquet) return null;

  return (
    <div className="container" style={{ paddingBottom: '4rem', alignItems: 'center' }}>
      {/* Top Greeting Header */}
      <div 
        style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          marginBottom: '2rem',
          animation: 'fadeIn 1s ease'
        }}
      >
        <div 
          className="flex-center" 
          style={{ 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em',
            fontWeight: 600,
            color: 'var(--color-primary)',
            marginBottom: '0.5rem'
          }}
        >
          <Heart size={14} fill="var(--color-primary)" /> A Gift For You
        </div>
        <h1 
          className="font-serif" 
          style={{ 
            fontSize: '2.25rem', 
            fontStyle: 'italic', 
            margin: 0,
            fontWeight: 500
          }}
        >
          {bouquet.recipient_name}
        </h1>
      </div>

      {/* The Bouquet Stage */}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          marginBottom: '2rem',
          animation: 'fadeIn 1s ease' 
        }}
      >
        <Canvas
          flowers={visibleFlowers}
          selectedId={null}
          onSelect={() => {}}
          onChange={() => {}}
          readOnly={true}
        />
      </div>

      {/* The Envelope Reveal */}
      {showEnvelope && (
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '500px',
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          <Envelope
            senderName={bouquet.sender_name}
            recipientName={bouquet.recipient_name}
            content={bouquet.letter_content}
            occasion={bouquet.occasion}
            onOpened={() => {
              setIsLetterOpened(true);
            }}
          />
        </div>
      )}

      {/* Voice Player Reveal */}
      {isLetterOpened && bouquet.audio_url && (
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '500px',
            animation: 'fadeInUp 0.6s ease'
          }}
        >
          <VoicePlayer audioUrl={bouquet.audio_url} />
        </div>
      )}
    </div>
  );
};
