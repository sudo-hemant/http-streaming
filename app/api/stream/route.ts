import { NextRequest } from 'next/server';

// Simulates a dynamic data generation function
// In real scenarios, this could be calling an AI model, database, or external API
async function generateNextData(iteration: number): Promise<any> {
  // Simulate async processing time (like AI generation)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    iteration,
    timestamp: new Date().toISOString(),
    message: `Dynamically generated response ${iteration}`,
    content: `This is content chunk ${iteration}. In a real scenario, this could be AI-generated text that's being streamed as it's created.`,
    randomValue: Math.floor(Math.random() * 100)
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 1; i <= 10; i++) {
          // Generate data dynamically when needed
          const data = await generateNextData(i);
          
          // Send the data as JSON with newline delimiter
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          
          // Wait before generating the next piece of data
          if (i < 10) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: 'Stream error' }) + '\n'));
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
    },
  });
}