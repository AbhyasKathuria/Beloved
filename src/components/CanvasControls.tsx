import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Copy, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  FlipHorizontal
} from 'lucide-react';

interface CanvasControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  
  // Selection-based controls
  hasSelection: boolean;
  onLayerUp: () => void;
  onLayerDown: () => void;
  onFlipHorizontal: () => void;
  onDuplicate: () => void;
  onDeleteSelected: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  hasSelection,
  onLayerUp,
  onLayerDown,
  onFlipHorizontal,
  onDuplicate,
  onDeleteSelected,
}) => {
  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '0.75rem 1rem',
        marginTop: '0.75rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* History Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="btn btn-secondary btn-icon-only"
          title="Undo"
          style={{ width: '40px', height: '40px', padding: 0 }}
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="btn btn-secondary btn-icon-only"
          title="Redo"
          style={{ width: '40px', height: '40px', padding: 0 }}
        >
          <Redo2 size={18} />
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear your beautiful canvas?')) {
              onClear();
            }
          }}
          className="btn btn-secondary btn-icon-only"
          title="Clear Canvas"
          style={{ 
            width: '40px', 
            height: '40px', 
            padding: 0,
            color: '#dc2626',
            background: 'rgba(220, 38, 38, 0.05)',
            borderColor: 'rgba(220, 38, 38, 0.1)'
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Selection Specific Controls */}
      {hasSelection ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, marginRight: '0.25rem' }}>
            Selected:
          </span>
          <button
            onClick={onLayerUp}
            className="btn btn-secondary btn-icon-only"
            title="Bring Forward"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={onLayerDown}
            className="btn btn-secondary btn-icon-only"
            title="Send Backward"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <ChevronDown size={18} />
          </button>
          <button
            onClick={onFlipHorizontal}
            className="btn btn-secondary btn-icon-only"
            title="Mirror / Flip"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <FlipHorizontal size={18} />
          </button>
          <button
            onClick={onDuplicate}
            className="btn btn-secondary btn-icon-only"
            title="Duplicate"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onDeleteSelected}
            className="btn btn-secondary btn-icon-only"
            title="Delete"
            style={{ 
              width: '40px', 
              height: '40px', 
              padding: 0,
              color: '#fff',
              background: '#dc2626',
              borderColor: 'transparent'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', padding: '0.5rem' }}>
          Tap a flower on the canvas to edit layering or delete it
        </div>
      )}
    </div>
  );
};
