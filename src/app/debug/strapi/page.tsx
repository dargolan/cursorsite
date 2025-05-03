'use client';

import React, { useState, useEffect } from 'react';

export default function StrapiDebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    async function checkStrapi() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/debug-strapi');
        const data = await response.json();
        
        if (data.error) {
          setError(data.message || 'Error fetching Strapi debug information');
          return;
        }
        
        setDebugData(data);
      } catch (err) {
        console.error('Error checking Strapi:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    checkStrapi();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Strapi Connection Debug</h1>
      
      <div className="mb-4 p-4 bg-gray-50 rounded border">
        <h2 className="font-semibold mb-2">Environment</h2>
        <p><strong>Strapi URL:</strong> {process.env.NEXT_PUBLIC_STRAPI_API_URL || 'Not set'}</p>
        <p><strong>Has Strapi token:</strong> {process.env.NEXT_PUBLIC_STRAPI_API_TOKEN ? 'Yes' : 'No'}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>
      
      {loading ? (
        <div className="text-center p-4">Testing Strapi connection...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h2 className="font-semibold text-red-700">Connection Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${
                debugData?.endpointTests?.find((test: any) => test.endpoint === 'Tags' && test.isSuccess)
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}></div>
              <span>
                {debugData?.endpointTests?.find((test: any) => test.endpoint === 'Tags' && test.isSuccess)
                  ? 'Strapi is online and responding to the Tags endpoint' 
                  : 'Strapi is not responding to the Tags endpoint'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Note: The base API endpoint may return 404 but specific endpoints like Tags and Tracks are working.
            </p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Endpoint Tests</h2>
            {debugData?.endpointTests?.map((test: any, index: number) => (
              <div key={index} className={`mb-2 p-3 rounded ${
                test.isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex justify-between">
                  <span className="font-medium">{test.endpoint}</span>
                  <span className={`text-sm ${test.isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                    {test.status} {test.statusText}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{test.url}</p>
                
                {test.error && (
                  <div className="mt-2 bg-red-100 p-2 rounded text-sm">
                    <strong>Error:</strong> {
                      typeof test.error === 'string' 
                        ? test.error 
                        : JSON.stringify(test.error, null, 2)
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Track Creation Test</h2>
            <div className={`p-3 rounded ${
              debugData?.createTest?.isSuccess 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between">
                <span className="font-medium">Test Track Creation</span>
                <span className={`text-sm ${debugData?.createTest?.isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                  {debugData?.createTest?.status} {debugData?.createTest?.statusText}
                </span>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Request</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(debugData?.createTest?.requestBody, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Response</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(debugData?.createTest?.responseData, null, 2)}
                  </pre>
                </div>
              </div>
              
              {debugData?.createTest?.error && (
                <div className="mt-2 bg-red-100 p-2 rounded text-sm">
                  <strong>Error:</strong> {
                    typeof debugData.createTest.error === 'string' 
                      ? debugData.createTest.error 
                      : JSON.stringify(debugData.createTest.error, null, 2)
                  }
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 border-t pt-4">
            <h2 className="text-xl font-semibold mb-2">Actions</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Tests
              </button>
              <a 
                href="/upload" 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block"
              >
                Back to Upload
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 