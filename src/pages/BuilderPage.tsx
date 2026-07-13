import React, { useState, useRef } from 'react';
import { Canvas } from '../components/Canvas';
import type { PlacedFlower } from '../components/Canvas';
import { FlowerPicker } from '../components/FlowerPicker';
import type { FlowerAsset } from '../components/FlowerPicker';
import { CanvasControls } from '../components/CanvasControls';
import { LetterComposer } from '../components/LetterComposer';
import type { ComposerData } from '../components/LetterComposer';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { useHistory } from '../hooks/useHistory';
import { saveBouquet } from '../supabaseClient';
import { ArrowRight, Layers, Sparkles, Clipboard } from 'lucide-react';

interface BuilderPageProps {
  onNavigateToDashboard: () => void;
}

export const BuilderPage: React.FC<BuilderPageProps> = ({ onNavigateToDashboard }) => {
  // Use custom history hook for the flowers state
  const {
    state: flowers,
    set: setFlowers,
    undo,
    redo,
    reset: resetFlowers,
    canUndo,
    canRedo,
  } = useHistory<PlacedFlower[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerData, setComposerData] = useState<ComposerData>({
    sender_name: '',
    recipient_name: '',
    occasion: 'anniversary',
    letter_content: '',
    lifespan: 'never',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const [showAboutModal, setShowAboutModal] = useState(false);
  const stageRef = useRef<any>(null);

  // Add flower to the center of virtual 800x800 coordinate space
  const handleAddFlower = (flower: FlowerAsset) => {
    const newFlower: PlacedFlower = {
      id: crypto.randomUUID(),
      name: flower.name,
      src: flower.src,
      x: 400,
      y: 400,
      scaleX: 0.7,
      scaleY: 0.7,
      rotation: 0,
    };
    
    const updated = [...flowers, newFlower];
    setFlowers(updated);
    setSelectedId(newFlower.id); // Auto-select the newly added flower
  };

  // Reordering: Bring Selected Forward
  const handleLayerUp = () => {
    if (!selectedId) return;
    const index = flowers.findIndex((f) => f.id === selectedId);
    if (index === -1 || index === flowers.length - 1) return; // Already at the top
    
    const updated = [...flowers];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    setFlowers(updated);
  };

  // Reordering: Send Selected Backward
  const handleLayerDown = () => {
    if (!selectedId) return;
    const index = flowers.findIndex((f) => f.id === selectedId);
    if (index === -1 || index === 0) return; // Already at the bottom
    
    const updated = [...flowers];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    setFlowers(updated);
  };

  // Duplicate Selected Flower
  const handleDuplicate = () => {
    if (!selectedId) return;
    const selected = flowers.find((f) => f.id === selectedId);
    if (!selected) return;

    const duplicated: PlacedFlower = {
      ...selected,
      id: crypto.randomUUID(),
      x: Math.min(750, selected.x + 30), // Slightly offset
      y: Math.min(750, selected.y + 30),
    };

    const updated = [...flowers, duplicated];
    setFlowers(updated);
    setSelectedId(duplicated.id);
  };

  // Delete Selected Flower
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const updated = flowers.filter((f) => f.id !== selectedId);
    setFlowers(updated);
    setSelectedId(null);
  };

  // Mirror/Flip Selected Flower
  const handleFlipHorizontal = () => {
    if (!selectedId) return;
    const updated = flowers.map((f) => {
      if (f.id === selectedId) {
        return {
          ...f,
          scaleX: -f.scaleX,
        };
      }
      return f;
    });
    setFlowers(updated);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    setFlowers([]);
    setSelectedId(null);
  };

  // Save bouquet and generate unique private link
  const handleSave = async () => {
    if (flowers.length === 0) {
      alert('Please place at least one flower to create a bouquet! 🌸');
      return;
    }
    
    setIsSaving(true);
    setSelectedId(null); // Clear selection transformer so it isn't in the snapshot

    // Wait a brief tick to allow selection state to clear visually before grabbing snapshot
    setTimeout(async () => {
      try {
        let snapshotBase64: string | undefined = undefined;
        if (stageRef.current) {
          snapshotBase64 = stageRef.current.toDataURL({ pixelRatio: 2 });
        }

        // Expiration calculations
        let expiresAt: string | null = null;
        if (composerData.lifespan === '30days') {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          expiresAt = date.toISOString();
        }

        const payload = {
          sender_name: composerData.sender_name,
          recipient_name: composerData.recipient_name,
          occasion: composerData.occasion,
          letter_content: composerData.letter_content,
          canvas_data: flowers,
          snapshot_url: null,
          audio_url: audioBase64,
          expires_at: expiresAt,
          max_views: composerData.lifespan === 'once' ? 1 : null,
        };

        const giftId = await saveBouquet(payload, snapshotBase64);
        
        // Build absolute sharing URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?gift=${giftId}`;
        setSavedUrl(shareUrl);
      } catch (err) {
        console.error('Error saving bouquet:', err);
        alert('Failed to save bouquet. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }, 100);
  };

  const handleCopyLink = () => {
    if (savedUrl) {
      navigator.clipboard.writeText(savedUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const startNewBouquet = () => {
    setSavedUrl(null);
    resetFlowers([]);
    setSelectedId(null);
    setComposerData({
      sender_name: '',
      recipient_name: '',
      occasion: 'anniversary',
      letter_content: '',
      lifespan: 'never',
    });
    setAudioBase64(null);
    // Reset background styles
    document.body.className = '';
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header bar */}
      <header 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '1.75rem', margin: 0 }} className="font-serif">
            Beloved
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setShowAboutModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            ❤️ Our Story
          </button>
          <button 
            onClick={onNavigateToDashboard}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Layers size={14} /> My Creations
          </button>
        </div>
      </header>

      {/* Main Builder layout */}
      {!savedUrl ? (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: '2rem',
            alignItems: 'start'
          }}
          className="builder-grid"
        >
          {/* Left Column: Canvas and controls */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Canvas
              flowers={flowers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={setFlowers}
              stageRef={stageRef}
            />
            <CanvasControls
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onClear={handleClearCanvas}
              hasSelection={!!selectedId}
              onLayerUp={handleLayerUp}
              onLayerDown={handleLayerDown}
              onFlipHorizontal={handleFlipHorizontal}
              onDuplicate={handleDuplicate}
              onDeleteSelected={handleDeleteSelected}
            />
            <FlowerPicker onAddFlower={handleAddFlower} />
          </div>

          {/* Right Column: Letter Composer & Voice Recorder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <LetterComposer
              data={composerData}
              onChange={setComposerData}
              onSave={handleSave}
              isSaving={isSaving}
            />
            <VoiceRecorder
              onAudioReady={(base64) => setAudioBase64(base64)}
              onClearAudio={() => setAudioBase64(null)}
            />
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div 
          className="glass-panel" 
          style={{ 
            maxWidth: '550px', 
            margin: '2rem auto', 
            padding: '3rem 2rem',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease'
          }}
        >
          <div 
            style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              animation: 'bounce 2s infinite'
            }}
          >
            ✉️💝
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Envelope Sealed!
          </h2>
          <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
            Your custom bouquet has been arranged and paired with your personal note.
            Share this private link to deliver the gift:
          </p>

          <div 
            className="flex-center"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              gap: '0.5rem',
              width: '100%'
            }}
          >
            <input
              type="text"
              readOnly
              value={savedUrl}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                outline: 'none',
                fontSize: '0.9rem',
                color: 'var(--color-text-title)',
                fontWeight: 500
              }}
            />
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary"
              style={{ 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.8rem',
                whiteSpace: 'nowrap'
              }}
            >
              {copySuccess ? 'Copied!' : (
                <>
                  <Clipboard size={14} /> Copy
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href={savedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Open Bouquet Reveal Preview <ArrowRight size={16} />
            </a>
            <button
              onClick={startNewBouquet}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Build Another Bouquet 🌸
            </button>
          </div>
        </div>
      )}

      {/* About Us / Our Story Modal */}
      {showAboutModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowAboutModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)', // Sleek slate glass mask
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '2.5rem 2rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <button
              onClick={() => setShowAboutModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                opacity: 0.6,
                color: 'var(--color-text-title)'
              }}
            >
              &times;
            </button>
            
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌹❤️🌹</div>
            
            <h2 className="font-serif" style={{ fontSize: '1.8rem', color: '#be123c', marginBottom: '1rem' }}>
              The Story of Beloved
            </h2>
            
            <div 
              style={{ 
                fontSize: '0.95rem', 
                lineHeight: 1.6, 
                color: 'var(--color-text-title)', 
                textAlign: 'left', 
                marginBottom: '2rem' 
              }}
            >
              <p style={{ marginBottom: '1rem' }}>
                Beloved was born out of the distance between two hearts. Inspired by a real-life long-distance relationship, the idea sparkled from a simple wish: a girl who adores flowers, and a boy who wanted to make her smile across the miles.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                Real flowers wither, and emojis feel too small for big emotions. So, he built a canvas where they could arrange digital blossoms—ones that never fade, never wilt, and carry love across any distance.
              </p>
              <p style={{ fontStyle: 'italic', color: '#be123c', textAlign: 'center', margin: '1.5rem 0', fontWeight: 500 }}>
                "For the flowers that will never fade, and the love that will never wilt."
              </p>
              
              <div 
                style={{ 
                  borderTop: '1px dashed var(--color-border)', 
                  paddingTop: '1.25rem', 
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Abhyas Kathuria</h4>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Founder</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Muskan Agarwal</h4>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Co-Founder</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAboutModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
