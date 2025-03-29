import React from 'react';

export default function StemsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Premium Stems</h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Take your productions to the next level with our high-quality multi-track stems.
          Mix, remix, and customize to create your perfect sound.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Featured stem pack 1 */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-2">Ambient Landscapes</h2>
            <p className="text-gray-400 mb-4">Atmospheric textures and evolving soundscapes</p>
            
            <div className="space-y-3 mb-6">
              {/* Stem tracks */}
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Main Melody</span>
                  </div>
                  <div className="text-sm text-gray-500">3:42</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-4/5"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Pad Layer</span>
                  </div>
                  <div className="text-sm text-gray-500">3:42</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-full"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Texture</span>
                  </div>
                  <div className="text-sm text-gray-500">3:42</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-2/3"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Percussion</span>
                  </div>
                  <div className="text-sm text-gray-500">3:42</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-3/5"></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>
                <span className="block font-bold text-2xl text-accent">$12.99</span>
                <span className="text-sm text-gray-400">WAV + MP3 formats</span>
              </div>
              <button className="btn btn-primary">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        
        {/* Featured stem pack 2 */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-2">Epic Cinematic</h2>
            <p className="text-gray-400 mb-4">Powerful orchestral elements for film and trailers</p>
            
            <div className="space-y-3 mb-6">
              {/* Stem tracks */}
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Orchestra Full</span>
                  </div>
                  <div className="text-sm text-gray-500">2:58</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-4/5"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Strings</span>
                  </div>
                  <div className="text-sm text-gray-500">2:58</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-3/4"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Brass</span>
                  </div>
                  <div className="text-sm text-gray-500">2:58</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-2/3"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Percussion</span>
                  </div>
                  <div className="text-sm text-gray-500">2:58</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-4/5"></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button className="mr-3 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="font-medium">Synth Elements</span>
                  </div>
                  <div className="text-sm text-gray-500">2:58</div>
                </div>
                <div className="h-6 bg-gray-600 rounded relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-accent opacity-30 w-1/2"></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>
                <span className="block font-bold text-2xl text-accent">$19.99</span>
                <span className="text-sm text-gray-400">WAV + MP3 formats</span>
              </div>
              <button className="btn btn-primary">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Want to try before you buy?</h2>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
          Download our free sample pack with stems from various genres to test in your productions.
        </p>
        <button className="btn btn-primary px-8 py-3">
          Download Free Samples
        </button>
      </div>
    </div>
  );
} 