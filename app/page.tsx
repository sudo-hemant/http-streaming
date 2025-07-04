'use client';

import { useState } from 'react';

export default function Home() {
  const [streamedData, setStreamedData] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = async () => {
    setIsStreaming(true);
    setStreamedData([]);
    setError(null);

    try {
      const response = await fetch('/api/stream');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            setStreamedData(prev => [...prev, data]);
          } catch (e) {
            console.error('Parse error:', e);
          }
        });
      }
    } catch (error) {
      console.error('Stream error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">HTTP Streaming Demo</h1>
      
      <div className="mb-8 flex gap-4">
        <a
          href="/sse"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Go to SSE Demo →
        </a>
      </div>
      
      <button
        onClick={startStream}
        disabled={isStreaming}
        className="mb-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isStreaming ? 'Streaming...' : 'Start Streaming'}
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Streamed Data ({streamedData.length} items)</h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {streamedData.length === 0 && !isStreaming && (
            <p className="text-gray-500">Click Start Streaming to begin receiving data</p>
          )}
          
          {streamedData.map((data, index) => (
            <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {streamedData.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Combined JSON:</h3>
            <pre className="text-sm overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(streamedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
