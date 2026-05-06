import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
async function test() {
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    prompt: 'hello'
  });
  console.log(Object.keys(result));
}
test().catch(e => console.error("Error:", e.message));
