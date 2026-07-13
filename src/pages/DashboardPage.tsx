import React, { useState, useEffect } from 'react';
import { getBouquet, getCreatedIdsFromLocalStorage } from '../supabaseClient';
import type { Bouquet } from '../supabaseClient';
import { ArrowLeft, Clipboard, ExternalLink, Calendar, Trash2 } from 'lucide-react';

interface DashboardPageProps {
  onNavigateHome: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateHome }) => {
  const [gifts, setGifts] = useState<Bouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadMyGifts = async () => {
      try {
        const ids = getCreatedIdsFromLocalStorage();
        if (ids.length === 0) {
          setGifts([]);
          setLoading(false);
          return;
        }

        // Fetch details for all created IDs
        const resolved = await Promise.all(ids.map((id) => getBouquet(id)));
        // Filter out any that were deleted or not found
        const validGifts = resolved.filter((g): g is Bouquet => g !== null);
        
        // Sort by creation date descending
        validGifts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setGifts(validGifts);
      } catch (err) {
        console.error('Error loading dashboard gifts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMyGifts();
  }, []);

  const handleCopy = (id: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gift=${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLocalRecord = (id: string) => {
    if (window.confirm('Remove this bouquet from your local creations history? (This will not delete it from the cloud if sent).')) {
      try {
        // Remove from list
        setGifts(gifts.filter((g) => g.id !== id));
        
        // Update index list
        const ids = getCreatedIdsFromLocalStorage();
        const updatedIds = ids.filter((localId) => localId !== id);
        localStorage.setItem('beloved_my_creations', JSON.stringify(updatedIds));

        // Also clean up local mock database if it exists there
        const mockDbData = localStorage.getItem('beloved_mock_bouquets');
        if (mockDbData) {
          const db = JSON.parse(mockDbData);
          if (db[id]) {
            delete db[id];
            localStorage.setItem('beloved_mock_bouquets', JSON.stringify(db));
          }
        }
      } catch (e) {
        console.error('Failed to delete local record', e);
      }
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Navigation Header */}
      <header 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          marginBottom: '2rem',
          marginTop: '1rem'
        }}
      >
        <button 
          onClick={onNavigateHome}
          className="btn btn-secondary btn-icon-only"
          style={{ width: '40px', height: '40px', padding: 0 }}
          title="Back to Builder"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif" style={{ fontSize: '1.75rem', margin: 0 }}>
            My Created Gifts
          </h1>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
            History of bouquets sent from this device
          </span>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.7 }}>
          Loading your creation history...
        </div>
      ) : gifts.length === 0 ? (
        <div 
          className="glass-panel flex-center"
          style={{ 
            flexDirection: 'column', 
            padding: '4rem 2rem', 
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥀</div>
          <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No bouquets created yet
          </h3>
          <p style={{ opacity: 0.7, maxWidth: '320px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create a custom bouquet and pair it with a love letter to see it listed here.
          </p>
          <button onClick={onNavigateHome} className="btn btn-primary">
            Build a Bouquet 🌸
          </button>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            animation: 'fadeIn 0.5s ease'
          }}
        >
          {gifts.map((gift) => {
            const dateStr = new Date(gift.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div 
                key={gift.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                {/* Visual Snapshot Preview */}
                {gift.snapshot_url ? (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img 
                      src={gift.snapshot_url} 
                      alt={`Bouquet for ${gift.recipient_name}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.3)',
                      border: '1px dashed var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      opacity: 0.5
                    }}
                  >
                    💐
                  </div>
                )}

                {/* Gift Meta */}
                <div style={{ textAlign: 'left' }}>
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        background: 'rgba(var(--color-primary-rgb), 0.1)', 
                        color: 'var(--color-primary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {gift.occasion.replace('-', ' ')}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Calendar size={12} /> {dateStr}
                    </span>
                  </div>
                  <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 500, margin: '0.2rem 0' }}>
                    To: {gift.recipient_name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    From: {gift.sender_name}
                  </span>
                </div>

                {/* Actions Row */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr auto', 
                    gap: '0.5rem',
                    marginTop: 'auto'
                  }}
                >
                  <button
                    onClick={() => handleCopy(gift.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  >
                    {copiedId === gift.id ? 'Copied!' : (
                      <>
                        <Clipboard size={12} /> Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={`${window.location.origin}${window.location.pathname}?gift=${gift.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  >
                    <ExternalLink size={12} /> View Reveal
                  </a>
                  <button
                    onClick={() => handleDeleteLocalRecord(gift.id)}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.5rem', 
                      color: '#dc2626', 
                      background: 'rgba(220, 38, 38, 0.05)',
                      borderColor: 'rgba(220, 38, 38, 0.1)'
                    }}
                    title="Remove from history"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
