'use client';

import React, { useState, useEffect } from 'react';

export default function DebugTagsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any>(null);
  const [strapiUrl, setStrapiUrl] = useState('');

  useEffect(() => {
    async function loadTags() {
      try {
        setLoading(true);
        setError(null);
        
        // Use our debug endpoint
        const response = await fetch('/api/debug-tags');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        setTags(data.processedTags || []);
        setRawData(data.original);
        setStrapiUrl(data.strapiUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    loadTags();
  }, []);
  
  // Count tags by type
  const tagCounts = tags.reduce((acc: Record<string, number>, tag) => {
    const type = tag.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Tags</h1>
      
      <div className="mb-4 p-4 bg-gray-50 rounded border">
        <h2 className="font-semibold mb-2">Environment</h2>
        <p><strong>Strapi URL:</strong> {strapiUrl || 'Not set'}</p>
        <p><strong>NEXT_PUBLIC_STRAPI_API_URL:</strong> {process.env.NEXT_PUBLIC_STRAPI_API_URL || 'Not set'}</p>
      </div>
      
      {loading ? (
        <div className="text-center p-4">Loading tags...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h2 className="font-semibold text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Tag Counts</h2>
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <span className="font-bold text-lg">{tags.length}</span> total tags
              </div>
              {Object.entries(tagCounts).map(([type, count]) => (
                <div key={type} className="bg-green-50 p-3 rounded">
                  <span className="font-bold text-lg">{count}</span> {type} tags
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Tags</h2>
            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-amber-600">No tags found</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map(tag => (
                      <tr key={tag.id} className="hover:bg-gray-50">
                        <td className="border p-2">{tag.id}</td>
                        <td className="border p-2">{tag.name}</td>
                        <td className="border p-2">{tag.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Raw Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        </>
      )}
      
      <div className="mt-8 border-t pt-4">
        <h2 className="text-xl font-semibold mb-2">Diagnostic Actions</h2>
        <div className="space-y-2">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
          <button 
            onClick={() => window.open('/api/debug-tags', '_blank')} 
            className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            View Raw API Response
          </button>
        </div>
      </div>
    </div>
  );
} 