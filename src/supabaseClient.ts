import { createClient } from '@supabase/supabase-js';
import type { PlacedFlower } from './components/Canvas';

export interface Bouquet {
  id: string;
  created_at: string;
  sender_name: string;
  recipient_name: string;
  occasion: string;
  letter_content: string;
  canvas_data: PlacedFlower[];
  snapshot_url: string | null;
  audio_url: string | null;
  expires_at: string | null;
  view_count: number;
  max_views: number | null; // 1 for self-destruct, null for unlimited
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are provided
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database key for local storage
const MOCK_DB_KEY = 'beloved_mock_bouquets';

// Helper to get all mock bouquets
const getMockBouquets = (): Record<string, Bouquet> => {
  try {
    const data = localStorage.getItem(MOCK_DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Error reading mock database', e);
    return {};
  }
};

// Helper to save all mock bouquets
const saveMockBouquets = (bouquets: Record<string, Bouquet>) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(bouquets));
};

/**
 * Saves a bouquet. In Supabase mode, it uploads the base64 snapshot to storage first, 
 * then inserts the record. In mock mode, it stores the snapshot as a base64 string directly
 * in localStorage.
 */
export async function saveBouquet(
  data: Omit<Bouquet, 'id' | 'created_at' | 'view_count'>,
  snapshotBase64?: string
): Promise<string> {
  const newId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    let snapshotUrl: string | null = null;
    let audioUrl: string | null = null;

    // Upload snapshot to Supabase Storage if provided
    if (snapshotBase64) {
      try {
        const fileData = await fetch(snapshotBase64).then((res) => res.blob());
        const filePath = `${newId}/snapshot.png`;
        const { error: uploadError } = await supabase.storage
          .from('bouquets')
          .upload(filePath, fileData, { contentType: 'image/png' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('bouquets')
          .getPublicUrl(filePath);
        
        snapshotUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error('Failed to upload snapshot to Supabase Storage:', err);
      }
    }

    // Upload audio note to Supabase Storage if provided
    if (data.audio_url && data.audio_url.startsWith('data:')) {
      try {
        const fileData = await fetch(data.audio_url).then((res) => res.blob());
        const filePath = `${newId}/voice.webm`;
        const { error: uploadError } = await supabase.storage
          .from('bouquets')
          .upload(filePath, fileData, { contentType: 'audio/webm' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('bouquets')
          .getPublicUrl(filePath);
        
        audioUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error('Failed to upload voice note to Supabase Storage:', err);
      }
    }

    const { error } = await supabase.from('bouquets').insert({
      id: newId,
      created_at: createdAt,
      sender_name: data.sender_name,
      recipient_name: data.recipient_name,
      occasion: data.occasion,
      letter_content: data.letter_content,
      canvas_data: data.canvas_data,
      snapshot_url: snapshotUrl,
      audio_url: audioUrl,
      expires_at: data.expires_at,
      view_count: 0,
      max_views: data.max_views,
    });

    if (error) {
      throw error;
    }
    return newId;
  } else {
    // Local storage fallback
    const mockDb = getMockBouquets();
    const mockBouquet: Bouquet = {
      ...data,
      id: newId,
      created_at: createdAt,
      view_count: 0,
      snapshot_url: snapshotBase64 || null, // Store base64 directly locally
    };
    mockDb[newId] = mockBouquet;
    saveMockBouquets(mockDb);
    
    // Also save this ID to the user's local creation index
    saveCreatedIdToLocalStorage(newId);

    return newId;
  }
}

/**
 * Retrieves a bouquet by ID.
 */
export async function getBouquet(id: string): Promise<Bouquet | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('bouquets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.warn('Bouquet not found in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      created_at: data.created_at,
      sender_name: data.sender_name,
      recipient_name: data.recipient_name,
      occasion: data.occasion,
      letter_content: data.letter_content,
      canvas_data: data.canvas_data,
      snapshot_url: data.snapshot_url,
      audio_url: data.audio_url,
      expires_at: data.expires_at,
      view_count: data.view_count,
      max_views: data.max_views,
    };
  } else {
    const mockDb = getMockBouquets();
    return mockDb[id] || null;
  }
}

/**
 * Increments the view count of a bouquet.
 */
export async function incrementViewCount(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    // We can execute an RPC or direct update
    const bouquet = await getBouquet(id);
    if (bouquet) {
      await supabase
        .from('bouquets')
        .update({ view_count: bouquet.view_count + 1 })
        .eq('id', id);
    }
  } else {
    const mockDb = getMockBouquets();
    if (mockDb[id]) {
      mockDb[id].view_count += 1;
      saveMockBouquets(mockDb);
    }
  }
}

/**
 * Track created bouquets locally on this device.
 */
const CREATIONS_KEY = 'beloved_my_creations';

export function getCreatedIdsFromLocalStorage(): string[] {
  try {
    const data = localStorage.getItem(CREATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCreatedIdToLocalStorage(id: string) {
  try {
    const ids = getCreatedIdsFromLocalStorage();
    if (!ids.includes(id)) {
      localStorage.setItem(CREATIONS_KEY, JSON.stringify([...ids, id]));
    }
  } catch (e) {
    console.error('Error saving creation ID locally', e);
  }
}
