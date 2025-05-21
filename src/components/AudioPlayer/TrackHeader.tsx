import React from 'react';
import Image from 'next/image';
import PlayButton from './PlayButton';
import { Tag } from '../../types';

interface TrackHeaderProps {
  imageUrl: string;
  title: string;
  bpm: number;
  tags: Tag[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onTagClick: (tag: Tag) => void;
}

const TrackHeader: React.FC<TrackHeaderProps> = ({
  imageUrl,
  title,
  bpm,
  tags,
  isPlaying,
  onPlayPause,
  onTagClick,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={imageUrl}
          alt={title}
          width={64}
          height={64}
          className="rounded-lg object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayButton isPlaying={isPlaying} onClick={onPlayPause} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-white">{title}</span>
        <span className="text-xs text-accent font-semibold">{bpm} BPM</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs text-gray-400 cursor-pointer hover:text-accent"
              onClick={() => onTagClick(tag)}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackHeader; 