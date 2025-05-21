import React from 'react';

interface ControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDownload: () => void;
  renderStemsButton: () => React.ReactNode;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onDownload,
  renderStemsButton,
}) => {
  return (
    <div className="flex items-center space-x-3 flex-shrink-0 min-w-[110px]">
      {/* Consistent width container for Stems button or placeholder */}
      <div className="w-[68px] flex justify-end">
        {renderStemsButton()}
      </div>
      <button 
        className="w-10 h-10 flex items-center justify-center text-[#1E1E1E] hover:text-[#1DF7CE] transition-colors border-2 border-[#1DF7CE] rounded-full bg-[#1DF7CE] hover:bg-transparent focus:outline-none"
        onClick={onDownload}
        title="Download track"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
      {isPlaying ? (
        <button onClick={onPause}>Pause</button>
      ) : (
        <button onClick={onPlay}>Play</button>
      )}
    </div>
  );
};

export default Controls; 