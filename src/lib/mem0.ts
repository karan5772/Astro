import { MemoryClient } from 'mem0ai';

const mem0Client = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY || 'dummy_key'
});

export default mem0Client;
