import { useState, useEffect } from 'react';
import { Tag } from '../types';

export function useTrackTags(track: any) {
  const [trackTags, setTrackTags] = useState<Tag[]>(track.tags || []);

  useEffect(() => {
    if (track.tags && Array.isArray(track.tags) && track.tags.length > 0) {
      setTrackTags(track.tags);
    } else {
      setTrackTags([]);
    }
  }, [track.id, track.tags]);

  const tagsByType = (trackTags || []).reduce<Record<string, Tag[]>>((acc, tag) => {
    const effectiveType = tag.type || 'genre';
    if (!acc[effectiveType]) acc[effectiveType] = [];
    acc[effectiveType].push(tag);
    return acc;
  }, {});

  const filteredTrackTags = Array.isArray(trackTags) ? trackTags.filter(tag => tag.type !== 'instrument') : [];

  return { trackTags, tagsByType, filteredTrackTags };
} 