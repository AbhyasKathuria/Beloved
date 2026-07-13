import React from 'react';

export interface OccasionPreset {
  id: string;
  label: string;
  themeClass: string;
  prompt: string;
  suggestion: string;
  envelopeColor: string;
  envelopeFlap: string;
}

export const OCCASION_PRESETS: OccasionPreset[] = [
  {
    id: 'anniversary',
    label: 'Anniversary 💖',
    themeClass: 'theme-anniversary',
    prompt: 'Share a special memory or explain why this milestone is so meaningful to you...',
    suggestion: 'Happy Anniversary, my love! Looking back at our time together, I am so grateful for...',
    envelopeColor: '#fda4af', // Rose light
    envelopeFlap: '#db2777', // Pink flap
  },
  {
    id: 'just-because',
    label: 'Just Because 🌸',
    themeClass: 'theme-just-because',
    prompt: 'Write a small, spontaneous note to brighten their day and make them smile...',
    suggestion: 'Hey! Just wanted to send you a little reminder of how much you mean to me today. I was thinking about...',
    envelopeColor: '#ecdfff', // Violet light
    envelopeFlap: '#7c3aed', // Violet flap
  },
  {
    id: 'sorry',
    label: 'Sorry 🌿',
    themeClass: 'theme-sorry',
    prompt: 'Write a comforting note, clear the air, or offer a sincere apology...',
    suggestion: "I wanted to write this to say I'm truly sorry. I value us and our connection more than words can say...",
    envelopeColor: '#d8f3df', // Emerald light
    envelopeFlap: '#059669', // Emerald flap
  },
  {
    id: 'long-distance',
    label: 'Long Distance 🌌',
    themeClass: 'theme-long-distance',
    prompt: 'Speak across the miles and write what you wish you could tell them in person...',
    suggestion: 'Counting down the days and hours until we are in the same time zone again. Until then, remember that...',
    envelopeColor: '#1e293b', // Slate dark
    envelopeFlap: '#fb7185', // Soft pink glow flap
  },
  {
    id: 'congratulations',
    label: 'Congratulations 🎉',
    themeClass: 'theme-congratulations',
    prompt: 'Cheer them on for their big achievement, graduation, promotion, or new chapter...',
    suggestion: 'You did it! I am so incredibly proud of you, your hard work, and this amazing achievement...',
    envelopeColor: '#fff4cc', // Amber light
    envelopeFlap: '#d97706', // Amber flap
  },
  {
    id: 'first-date',
    label: 'First Date ✨',
    themeClass: 'theme-first-date',
    prompt: 'Recall that initial magic and describe how you felt when you first met...',
    suggestion: 'I was just thinking about that first day we met. I remember being so nervous, but the moment you smiled...',
    envelopeColor: '#ffedd5', // Orange light
    envelopeFlap: '#ea580c', // Orange flap
  },
];

export interface ComposerData {
  sender_name: string;
  recipient_name: string;
  occasion: string;
  letter_content: string;
  lifespan: 'never' | '30days' | 'once';
}

interface LetterComposerProps {
  data: ComposerData;
  onChange: (data: ComposerData) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const LetterComposer: React.FC<LetterComposerProps> = ({
  data,
  onChange,
  onSave,
  isSaving,
}) => {
  const currentPreset = OCCASION_PRESETS.find((p) => p.id === data.occasion) || OCCASION_PRESETS[0];

  const handleFieldChange = (field: keyof ComposerData, value: string) => {
    const updated = { ...data, [field]: value };
    onChange(updated);

    // If occasion changes, update the body theme class dynamically
    if (field === 'occasion') {
      const selectedPreset = OCCASION_PRESETS.find((p) => p.id === value);
      if (selectedPreset) {
        // Reset classes
        document.body.className = '';
        document.body.classList.add(selectedPreset.themeClass);
      }
    }
  };

  const handleUseSuggestion = () => {
    const suggestionText = currentPreset.suggestion;
    if (!data.letter_content.includes(suggestionText)) {
      const currentText = data.letter_content ? `${data.letter_content}\n\n` : '';
      handleFieldChange('letter_content', currentText + suggestionText);
    }
  };

  const canSave = 
    data.sender_name.trim() !== '' && 
    data.recipient_name.trim() !== '' && 
    data.letter_content.trim() !== '';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', textAlign: 'left', fontWeight: 600 }}>
        Write Your Love Letter
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">From (Your Name)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Abhyas"
            value={data.sender_name}
            onChange={(e) => handleFieldChange('sender_name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">To (Their Name)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Beloved"
            value={data.recipient_name}
            onChange={(e) => handleFieldChange('recipient_name', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Occasion & Theme</label>
        <select
          className="form-select"
          value={data.occasion}
          onChange={(e) => handleFieldChange('occasion', e.target.value)}
        >
          {OCCASION_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Personal Message</span>
          <button
            onClick={handleUseSuggestion}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Nudge opening line ✨
          </button>
        </label>
        <textarea
          className="form-textarea"
          placeholder={currentPreset.prompt}
          value={data.letter_content}
          onChange={(e) => handleFieldChange('letter_content', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Link Lifespan</label>
        <select
          className="form-select"
          value={data.lifespan}
          onChange={(e) => handleFieldChange('lifespan', e.target.value as any)}
        >
          <option value="never">Never expires (keep forever)</option>
          <option value="30days">Expire in 30 days</option>
          <option value="once">View once (self-destruct after opening)</option>
        </select>
      </div>

      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
      >
        {isSaving ? 'Sealing envelope...' : 'Create & Generate Gift Link 💝'}
      </button>
    </div>
  );
};
