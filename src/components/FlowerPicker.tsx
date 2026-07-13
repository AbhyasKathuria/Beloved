import React, { useState } from 'react';
import flowerListData from '../flowerList.json';

interface FlowerCategory {
  id: string;
  label: string;
  files: string[];
}

const flowerListDataTyped = flowerListData as { categories: FlowerCategory[] };

export interface FlowerAsset {
  name: string;
  src: string;
  label: string;
}

interface FlowerPickerProps {
  onAddFlower: (flower: FlowerAsset) => void;
}

export const FlowerPicker: React.FC<FlowerPickerProps> = ({ onAddFlower }) => {
  // Read dynamic categories from generated json
  const categories = flowerListDataTyped.categories || [];
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || 'Rose');

  const activeCatData = categories.find((cat) => cat.id === activeCategory);
  const activeFiles = activeCatData?.files || [];

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '1.25rem',
        marginTop: '1.25rem',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left'
      }}
    >
      {/* Category Tabs */}
      <div 
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(225, 29, 72, 0.1)',
          marginBottom: '1rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeCategory === cat.id ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)',
              background: activeCategory === cat.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)',
              color: activeCategory === cat.id ? '#fff' : 'var(--color-text-main)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              outline: 'none'
            }}
          >
            {cat.label} {cat.files.length > 0 ? `(${cat.files.length})` : ''}
          </button>
        ))}
      </div>

      {/* Grid of Items */}
      {activeFiles.length > 0 ? (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
            gap: '0.75rem',
            maxHeight: '220px',
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}
        >
          {activeFiles.map((file, index) => {
            const fileName = file.split('/').pop() || '';
            const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            const itemLabel = `${activeCatData?.label.split(' ')[0]} #${index + 1}`;

            return (
              <button
                key={file}
                onClick={() => onAddFlower({ name: baseName, src: file, label: itemLabel })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div 
                  style={{
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src={file} 
                    alt={itemLabel} 
                    style={{ 
                      maxWidth: '90%', 
                      maxHeight: '90%', 
                      objectFit: 'contain'
                    }} 
                  />
                </div>
                <span 
                  style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 500, 
                    color: 'var(--color-text-main)',
                    marginTop: '0.25rem',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                  title={baseName}
                >
                  {baseName}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty Folder Instructions */
        <div 
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed rgba(225, 29, 72, 0.15)'
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📂🌸</div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-title)', marginBottom: '0.25rem' }}>
            No assets found in Flowers/{activeCategory}
          </h4>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.4, maxWidth: '340px', margin: '0 auto' }}>
            Place your transparent PNG files in:<br />
            <code style={{ fontSize: '0.7rem', wordBreak: 'break-all', display: 'block', margin: '0.4rem 0', background: 'rgba(255,255,255,0.5)' }}>
              C:\Users\kathu\Desktop\projects\Beloved_me\Flowers\{activeCategory}
            </code>
            and start the server to see them load here automatically!
          </p>
        </div>
      )}
    </div>
  );
};
