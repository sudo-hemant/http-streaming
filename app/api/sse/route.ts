import { NextRequest } from 'next/server';

// Simulates a dynamic data generation function
async function generateSSEData(iteration: number): Promise<any> {
  // Simulate async processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    iteration,
    timestamp: new Date().toISOString(),
    message: `SSE Event ${iteration}`,
    content: `This is server-sent event number ${iteration}. SSE is great for real-time updates.`,
    eventType: iteration % 2 === 0 ? 'update' : 'notification',
    randomValue: Math.floor(Math.random() * 100)
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(': Connected to SSE stream\n\n'));
      
      try {
        for (let i = 1; i <= 10; i++) {
          // Generate data dynamically
          const data = await generateSSEData(i);
          
          // Format as SSE
          // Can include event type, id, and data
          const sseMessage = [
            `event: ${data.eventType}`,
            `id: ${i}`,
            `data: ${JSON.stringify(data)}`,
            '', // Empty line to signal end of message
            ''  // Extra newline for message separator
          ].join('\n');
          
          controller.enqueue(encoder.encode(sseMessage));
          
          // Wait before generating the next event
          if (i < 10) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // Send completion event
        const completionMessage = [
          'event: complete',
          'data: {"status": "Stream completed successfully"}',
          '',
          ''
        ].join('\n');
        
        controller.enqueue(encoder.encode(completionMessage));
      } catch (error) {
        // Send error event
        const errorMessage = [
          'event: error',
          `data: ${JSON.stringify({ error: 'Stream error occurred' })}`,
          '',
          ''
        ].join('\n');
        
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
    },
  });
}