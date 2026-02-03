/**
 * HTTP Chunked Streaming API Route
 *
 * This endpoint demonstrates HTTP chunked transfer encoding, which allows
 * the server to send data in pieces (chunks) as it becomes available,
 * rather than waiting for all data to be ready.
 *
 * Use Cases:
 * - Streaming AI-generated responses (like ChatGPT)
 * - Large data processing with progress updates
 * - Real-time data that's generated on-the-fly
 *
 * How it works:
 * 1. Client makes a fetch() request to this endpoint
 * 2. Server starts sending data chunks immediately
 * 3. Client reads chunks using response.body.getReader()
 * 4. Each chunk is a JSON object followed by a newline (NDJSON format)
 *
 * Client-side consumption:
 * ```javascript
 * const response = await fetch('/api/stream');
 * const reader = response.body.getReader();
 * const decoder = new TextDecoder();
 *
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *
 *   const text = decoder.decode(value);
 *   const lines = text.split('\n').filter(line => line.trim());
 *   lines.forEach(line => {
 *     const data = JSON.parse(line);
 *     console.log(data);
 *   });
 * }
 * ```
 */

import { createChunkedResponse, delay } from '@/app/lib/streaming';

/**
 * Generates data chunks with simulated processing time.
 * In real scenarios, this could be:
 * - Calling an AI model
 * - Processing large datasets
 * - Fetching from external APIs
 */
async function* generateStreamData() {
  for (let i = 1; i <= 10; i++) {
    // Simulate async processing time (like AI generation)
    await delay(500);

    yield {
      iteration: i,
      timestamp: new Date().toISOString(),
      message: `Dynamically generated response ${i}`,
      content: `This is content chunk ${i}. In a real scenario, this could be AI-generated text that's being streamed as it's created.`,
      randomValue: Math.floor(Math.random() * 100)
    };

    // Add delay between chunks (except for the last one)
    if (i < 10) {
      await delay(1000);
    }
  }
}

export async function GET() {
  return createChunkedResponse(generateStreamData());
}
