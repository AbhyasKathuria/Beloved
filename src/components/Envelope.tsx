import React, { useState } from 'react';
import { OCCASION_PRESETS } from './LetterComposer';

interface EnvelopeProps {
  senderName: string;
  recipientName: string;
  content: string;
  occasion: string;
  onOpened: () => void;
}

export const Envelope: React.FC<EnvelopeProps> = ({
  senderName,
  recipientName,
  content,
  occasion,
  onOpened,
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [showFullLetter, setShowFullLetter] = useState(false);

  const preset = OCCASION_PRESETS.find((p) => p.id === occasion) || OCCASION_PRESETS[0];

  // Map envelope styling variables based on preset colors
  const envStyles = {
    '--env-bg': preset.envelopeColor,
    '--env-flap-color': preset.envelopeFlap,
    '--env-pocket-color': preset.envelopeColor,
    '--env-pocket-side-color': preset.envelopeFlap,
  } as React.CSSProperties;

  const handleOpen = () => {
    if (isOpened) return;
    setIsBroken(true);
    
    // Step 1: Flap opens
    setTimeout(() => {
      setIsOpened(true);
    }, 300);

    // Step 2: Letter slides up
    setTimeout(() => {
      setShowFullLetter(true);
      onOpened();
    }, 1200);
  };

  return (
    <div 
      className="flex-center" 
      style={{ 
        flexDirection: 'column', 
        minHeight: '380px',
        perspective: '1000px',
        margin: '2rem 0'
      }}
    >
      {!showFullLetter ? (
        <div 
          className={`envelope-wrapper ${isOpened ? 'open' : ''}`}
          style={envStyles}
          onClick={handleOpen}
        >
          {/* Top Flap */}
          <div className="envelope-flap" />
          
          {/* Inner Letter Preview */}
          <div className="letter-paper flex-center" style={{ flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              A letter for
            </span>
            <span 
              className="font-serif" 
              style={{ 
                fontSize: '1.25rem', 
                color: 'var(--color-primary)', 
                fontWeight: 'italic',
                margin: '0.2rem 0'
              }}
            >
              {recipientName}
            </span>
          </div>

          {/* Pocket */}
          <div className="envelope-pocket" />
          <div className="envelope-pocket-left-right" />

          {/* Wax Seal */}
          <div className={`envelope-seal ${isBroken ? 'broken' : ''}`}>
            💌
          </div>
        </div>
      ) : (
        <div 
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2.5rem 2rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(225, 29, 72, 0.15)',
            background: '#fffefc', // Cozy warm paper white
            transform: 'scale(1)',
            opacity: 1,
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'fadeIn 0.6s ease'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              borderBottom: '1px dashed rgba(225, 29, 72, 0.15)', 
              paddingBottom: '1rem', 
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}
          >
            <h4 
              className="font-serif" 
              style={{ 
                fontSize: '1.5rem', 
                color: '#9f1239', // Fixed deep rose-crimson ink
                fontStyle: 'italic',
                fontWeight: 500
              }}
            >
              Dear {recipientName},
            </h4>
          </div>

          {/* Message Content */}
          <div 
            className="font-serif" 
            style={{ 
              fontSize: '1.15rem', 
              lineHeight: 1.7, 
              color: '#2d1a1a', // Fixed dark warm chocolate ink
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              minHeight: '150px'
            }}
          >
            {content}
          </div>

          {/* Footer */}
          <div 
            style={{ 
              marginTop: '2rem', 
              textAlign: 'right',
              borderTop: '1px dashed rgba(225, 29, 72, 0.15)',
              paddingTop: '1rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#705c5c', display: 'block' }}>
              With love,
            </span>
            <h4 
              className="font-serif" 
              style={{ 
                fontSize: '1.4rem', 
                color: '#9f1239', // Fixed deep rose-crimson ink
                fontStyle: 'italic',
                marginTop: '0.25rem',
                fontWeight: 500
              }}
            >
              {senderName}
            </h4>
          </div>
        </div>
      )}

      {!isOpened && (
        <span 
          className="animate-pulse-soft"
          style={{ 
            marginTop: '1.5rem', 
            fontSize: '0.85rem', 
            color: 'var(--color-text-muted)',
            fontWeight: 500
          }}
        >
          Tap the envelope seal to open the letter ✨
        </span>
      )}
    </div>
  );
};
