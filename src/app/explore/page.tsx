import React from 'react';

export default function ExplorePage() {
  // Mock data for genre filters
  const genres = [
    'Electronic', 'Ambient', 'Hip Hop', 'Cinematic', 
    'Rock', 'Jazz', 'Lo-Fi', 'Classical', 'Pop'
  ];
  
  // Mock data for mood filters
  const moods = [
    'Uplifting', 'Dramatic', 'Relaxed', 'Tense', 
    'Inspirational', 'Melancholic', 'Energetic'
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Tracks</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-medium mb-4">Filters</h2>
            
            <div className="mb-6">
              <h3 className="text-sm uppercase text-gray-400 mb-2">Genre</h3>
              <div className="space-y-2">
                {genres.map(genre => (
                  <label key={genre} className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-600 text-accent focus:ring-accent" 
                    />
                    <span className="ml-2">{genre}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm uppercase text-gray-400 mb-2">Mood</h3>
              <div className="space-y-2">
                {moods.map(mood => (
                  <label key={mood} className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-600 text-accent focus:ring-accent" 
                    />
                    <span className="ml-2">{mood}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm uppercase text-gray-400 mb-2">Duration</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="duration" 
                    className="border-gray-600 text-accent focus:ring-accent" 
                  />
                  <span className="ml-2">0-30 seconds</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="duration" 
                    className="border-gray-600 text-accent focus:ring-accent" 
                  />
                  <span className="ml-2">30-60 seconds</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="duration" 
                    className="border-gray-600 text-accent focus:ring-accent" 
                  />
                  <span className="ml-2">1-3 minutes</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="duration" 
                    className="border-gray-600 text-accent focus:ring-accent" 
                  />
                  <span className="ml-2">3+ minutes</span>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm uppercase text-gray-400 mb-2">BPM</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="60"
                  max="200"
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>60</span>
                  <span>200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Track grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for track cards */}
            {Array.from({ length: 12 }).map((_, idx) => (
              <div 
                key={idx} 
                className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-24 bg-gray-700 flex items-center justify-center">
                  <div className="w-full h-12 bg-gray-600 relative">
                    {/* Placeholder for waveform */}
                    <div className="absolute top-0 left-0 h-full bg-accent opacity-30" style={{ width: `${Math.random() * 50 + 50}%` }}></div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">Track Title {idx + 1}</h3>
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                      {Math.floor(Math.random() * 40 + 80)} BPM
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                      {genres[Math.floor(Math.random() * genres.length)]}
                    </span>
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                      {moods[Math.floor(Math.random() * moods.length)]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <button className="btn btn-primary text-sm">
                      Preview
                    </button>
                    <button className="btn btn-secondary text-sm">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <nav>
              <ul className="flex space-x-2">
                <li>
                  <button className="btn btn-secondary">Previous</button>
                </li>
                <li>
                  <button className="btn btn-primary">1</button>
                </li>
                <li>
                  <button className="btn btn-secondary">2</button>
                </li>
                <li>
                  <button className="btn btn-secondary">3</button>
                </li>
                <li>
                  <button className="btn btn-secondary">Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 