/**
 * Streaming Utilities
 *
 * Helper functions to simplify creating HTTP streaming responses.
 * These utilities abstract away the complexity of TextEncoder, ReadableStream,
 * and controller management.
 */

// ============================================================================
// Types
// ============================================================================

export interface SSEMessage {
  data: unknown;
  event?: string;
  id?: string | number;
}

export interface ChunkedStreamOptions {
  /** Custom headers to merge with defaults */
  headers?: Record<string, string>;
}

export interface SSEStreamOptions {
  /** Custom headers to merge with defaults */
  headers?: Record<string, string>;
  /** Send a comment as the first message (keeps connection alive) */
  initialComment?: string;
}

// ============================================================================
// SSE (Server-Sent Events) Utilities
// ============================================================================

/**
 * Formats data into SSE protocol format.
 *
 * SSE messages follow this format:
 * ```
 * event: eventName
 * id: 123
 * data: {"your": "json"}
 *
 * ```
 * (Note: Two newlines at the end signal message completion)
 *
 * @param message - The message object containing data, event type, and optional id
 * @returns Formatted SSE string ready to be sent
 *
 * @example
 * formatSSEMessage({ data: { count: 1 }, event: 'update', id: 1 })
 * // Returns: "event: update\nid: 1\ndata: {\"count\":1}\n\n"
 */
export function formatSSEMessage(message: SSEMessage): string {
  const lines: string[] = [];

  if (message.event) {
    lines.push(`event: ${message.event}`);
  }

  if (message.id !== undefined) {
    lines.push(`id: ${message.id}`);
  }

  const dataString = typeof message.data === 'string'
    ? message.data
    : JSON.stringify(message.data);

  lines.push(`data: ${dataString}`);
  lines.push(''); // Empty line
  lines.push(''); // Message separator

  return lines.join('\n');
}

/**
 * Creates an SSE Response from an async generator.
 *
 * This function handles all the complexity of:
 * - Creating a TextEncoder to convert strings to bytes
 * - Setting up a ReadableStream with proper controller management
 * - Formatting messages in SSE protocol format
 * - Setting correct HTTP headers
 *
 * @param generator - An async generator that yields SSEMessage objects
 * @param options - Optional configuration for headers and initial comment
 * @returns A Response object ready to be returned from an API route
 *
 * @example
 * // In your API route:
 * async function* generateEvents() {
 *   for (let i = 1; i <= 5; i++) {
 *     yield { data: { count: i }, event: 'update', id: i };
 *     await new Promise(r => setTimeout(r, 1000));
 *   }
 * }
 *
 * export async function GET() {
 *   return createSSEResponse(generateEvents());
 * }
 */
export function createSSEResponse(
  generator: AsyncGenerator<SSEMessage, void, unknown>,
  options: SSEStreamOptions = {}
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial comment if provided (helps with connection establishment)
        if (options.initialComment) {
          controller.enqueue(encoder.encode(`: ${options.initialComment}\n\n`));
        }

        // Iterate through the generator and send each message
        for await (const message of generator) {
          const formattedMessage = formatSSEMessage(message);
          controller.enqueue(encoder.encode(formattedMessage));
        }
      } catch (error) {
        // Send error event before closing
        const errorMessage = formatSSEMessage({
          data: { error: error instanceof Error ? error.message : 'Stream error occurred' },
          event: 'error'
        });
        controller.enqueue(encoder.encode(errorMessage));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...options.headers
    }
  });
}

// ============================================================================
// HTTP Chunked Streaming Utilities
// ============================================================================

/**
 * Creates a chunked streaming Response from an async generator.
 *
 * This function handles all the complexity of:
 * - Creating a TextEncoder to convert strings to bytes
 * - Setting up a ReadableStream with proper controller management
 * - Formatting data as newline-delimited JSON (NDJSON)
 * - Setting correct HTTP headers for chunked transfer
 *
 * Each yielded value is JSON-stringified and followed by a newline,
 * making it easy to parse on the client side.
 *
 * @param generator - An async generator that yields data objects
 * @param options - Optional configuration for custom headers
 * @returns A Response object ready to be returned from an API route
 *
 * @example
 * // In your API route:
 * async function* generateData() {
 *   for (let i = 1; i <= 5; i++) {
 *     yield { iteration: i, message: `Chunk ${i}` };
 *     await new Promise(r => setTimeout(r, 1000));
 *   }
 * }
 *
 * export async function GET() {
 *   return createChunkedResponse(generateData());
 * }
 */
export function createChunkedResponse(
  generator: AsyncGenerator<unknown, void, unknown>,
  options: ChunkedStreamOptions = {}
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Iterate through the generator and send each chunk
        for await (const data of generator) {
          const jsonLine = JSON.stringify(data) + '\n';
          controller.enqueue(encoder.encode(jsonLine));
        }
      } catch (error) {
        // Send error as JSON before closing
        const errorData = JSON.stringify({
          error: error instanceof Error ? error.message : 'Stream error'
        }) + '\n';
        controller.enqueue(encoder.encode(errorData));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...options.headers
    }
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * A simple delay function for use in generators.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 *
 * @example
 * async function* generate() {
 *   yield { message: 'First' };
 *   await delay(1000);
 *   yield { message: 'Second (after 1 second)' };
 * }
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
