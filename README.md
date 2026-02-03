# HTTP Streaming Demo

A Next.js demo project showcasing two HTTP streaming approaches:

1. **HTTP Chunked Streaming** - Using fetch API with `Transfer-Encoding: chunked`
2. **Server-Sent Events (SSE)** - Using the EventSource API

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the Chunked Streaming demo.

Open [http://localhost:3000/sse](http://localhost:3000/sse) for the SSE demo.

## API Endpoints

| Endpoint | Type | Description |
|----------|------|-------------|
| `GET /api/stream` | Chunked | Streams JSON data chunks every 1.5s |
| `GET /api/sse` | SSE | Streams events with types (update, notification) |

## Project Structure

```
app/
├── api/
│   ├── stream/route.ts    # Chunked streaming endpoint
│   └── sse/route.ts       # Server-Sent Events endpoint
├── lib/
│   └── streaming.ts       # Reusable streaming utilities
├── page.tsx               # Chunked streaming demo page
└── sse/page.tsx           # SSE demo page
```

## Streaming Utilities

The `app/lib/streaming.ts` file provides helper functions:

```typescript
import { createChunkedResponse, createSSEResponse, delay } from '@/app/lib/streaming';

// Chunked streaming
async function* generateData() {
  for (let i = 1; i <= 5; i++) {
    yield { count: i };
    await delay(1000);
  }
}
return createChunkedResponse(generateData());

// SSE streaming
async function* generateEvents() {
  yield { data: { message: 'Hello' }, event: 'update', id: 1 };
}
return createSSEResponse(generateEvents());
```

## Learn More

See **[STREAMING_GUIDE.md](./STREAMING_GUIDE.md)** for a comprehensive guide covering:

- How HTTP streaming works
- TextEncoder, ReadableStream, and Controller explained
- Step-by-step code walkthroughs
- SSE vs Chunked streaming comparison
- Client-side consumption patterns
- Real-world examples (ChatGPT-style, notifications)

## Tech Stack

- Next.js 15
- TypeScript
- Web Streams API
- Server-Sent Events
