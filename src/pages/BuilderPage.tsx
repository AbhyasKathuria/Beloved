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
        <button 
          onClick={onNavigateToDashboard}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <Layers size={14} /> My Creations
        </button>
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
    </div>
  );
};
