export interface Tag {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'instrument';
  parent?: string;
  count?: number;
}

export interface Stem {
  id: string;
  name: string;
  url: string;
  price: number;
  duration: number;
  waveform?: number[];
}

export interface Track {
  id: string;
  title: string;
  bpm: number;
  tags: Tag[];
  duration: number;
  imageUrl: string;
  audioUrl: string;
  waveform?: number[];
  hasStems: boolean;
  stems?: Stem[];
}

export interface CartItem {
  id: string;
  type: 'track' | 'stem';
  price: number;
  name: string;
  trackTitle: string;
  imageUrl: string;
} 