'use client';

import { useState, useEffect } from 'react';

interface SSEData {
  iteration: number;
  timestamp: string;
  message: string;
  content: string;
  eventType: string;
  randomValue: number;
}

export default function SSEPage() {
  const [events, setEvents] = useState<SSEData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connectToSSE = () => {
    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
    }

    setEvents([]);
    setError(null);
    setIsConnected(true);

    const source = new EventSource('/api/sse');
    setEventSource(source);

    source.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    source.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Connection error occurred');
      setIsConnected(false);
    };

    // Listen for specific event types
    source.addEventListener('update', (event) => {
      try {
        const data: SSEData = JSON.parse(event.data);
        setEvents(prev => [...prev, data]);
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    source.addEventListener('notification', (event) => {
      try {
        const data: SSEData = JSON.parse(event.data);
        setEvents(prev => [...prev, data]);
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    source.addEventListener('complete', (event) => {
      console.log('Stream completed:', event.data);
      setIsConnected(false);
      source.close();
    });

    source.addEventListener('error', (event) => {
      const errorData = JSON.parse(event.data);
      setError(errorData.error);
      setIsConnected(false);
      source.close();
    });
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Server-Sent Events Demo</h1>
      
      <div className="flex gap-4 mb-8">
        <button
          onClick={connectToSSE}
          disabled={isConnected}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isConnected ? 'Connected' : 'Connect to SSE'}
        </button>
        
        {isConnected && (
          <button
            onClick={disconnect}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className="text-sm">
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">
          Received Events ({events.length})
        </h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {events.length === 0 && (
            <p className="text-gray-500">
              Click "Connect to SSE" to start receiving events
            </p>
          )}
          
          {events.map((event, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg shadow ${
                event.eventType === 'update' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Event Type: {event.eventType}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {events.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">All Events (Combined):</h3>
            <pre className="text-sm overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(events, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}