// Render the footer with tags and the download/cart button
return (
  <div className="flex flex-col flex-1">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-medium text-white">{track.title}</h3>
      <span className="text-sm text-gray-400">{track.bpm} BPM</span>
    </div>
    
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-400">
        {formatDuration(track.duration)}
      </div>
    </div>
    
    <div className="flex flex-wrap gap-2 mt-auto">
      {track.tags.map((tag) => (
        <Tag 
          key={tag.id} 
          label={tag.name} 
          onClick={() => onTagClick(tag)} 
        />
      ))}
    </div>
  </div>
); 