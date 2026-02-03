/**
 * Server-Sent Events (SSE) API Route
 *
 * This endpoint demonstrates Server-Sent Events, a standard for pushing
 * real-time updates from server to client over HTTP.
 *
 * Key differences from regular HTTP streaming:
 * - Uses the standardized SSE protocol format
 * - Supports named event types (update, notification, error, etc.)
 * - Supports event IDs for resumption after disconnection
 * - Client uses the simple EventSource API (auto-reconnects!)
 *
 * Use Cases:
 * - Real-time notifications
 * - Live feeds (social media, news)
 * - Stock price updates
 * - Progress indicators
 * - Chat applications (server-to-client messages)
 *
 * SSE Message Format:
 * ```
 * event: eventName
 * id: 123
 * data: {"your": "json"}
 *
 * ```
 *
 * Client-side consumption:
 * ```javascript
 * const source = new EventSource('/api/sse');
 *
 * source.addEventListener('update', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Update:', data);
 * });
 *
 * source.addEventListener('notification', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Notification:', data);
 * });
 *
 * source.onerror = () => console.log('Connection lost');
 * ```
 */

import { createSSEResponse, delay, SSEMessage } from '@/app/lib/streaming';

/**
 * Generates SSE events with different event types.
 * The generator yields SSEMessage objects that are automatically
 * formatted into the SSE protocol format.
 */
async function* generateSSEEvents(): AsyncGenerator<SSEMessage, void, unknown> {
  for (let i = 1; i <= 10; i++) {
    // Simulate async processing
    await delay(500);

    const eventType = i % 2 === 0 ? 'update' : 'notification';

    yield {
      data: {
        iteration: i,
        timestamp: new Date().toISOString(),
        message: `SSE Event ${i}`,
        content: `This is server-sent event number ${i}. SSE is great for real-time updates.`,
        eventType,
        randomValue: Math.floor(Math.random() * 100)
      },
      event: eventType,
      id: i
    };

    // Add delay between events (except for the last one)
    if (i < 10) {
      await delay(2000);
    }
  }

  // Send completion event
  yield {
    data: { status: 'Stream completed successfully' },
    event: 'complete'
  };
}

export async function GET() {
  return createSSEResponse(generateSSEEvents(), {
    initialComment: 'Connected to SSE stream'
  });
}
