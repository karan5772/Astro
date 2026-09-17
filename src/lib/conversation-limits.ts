/**
 * Ceilings on what a single account can store. Conversations are written
 * straight from the client, so without these one authenticated user can push
 * unbounded data into the database.
 */
export const MAX_TITLE_LENGTH = 120;
export const MAX_MESSAGES_PER_CONVERSATION = 400;
export const MAX_MESSAGE_LENGTH = 8000;
export const MAX_CONVERSATIONS_PER_USER = 200;

export type StoredMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Returns the trimmed messages, or an error string. Anything that isn't a
 * well-formed user/assistant turn is rejected rather than silently dropped, so
 * a client bug surfaces instead of quietly losing a conversation.
 */
export function parseMessages(input: unknown):
  | { ok: true; value: StoredMessage[] }
  | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: 'messages must be an array' };
  if (input.length > MAX_MESSAGES_PER_CONVERSATION) {
    return { ok: false, error: `messages cannot exceed ${MAX_MESSAGES_PER_CONVERSATION} entries` };
  }

  const value: StoredMessage[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'each message must be an object' };
    const { role, content } = raw as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: 'message role must be "user" or "assistant"' };
    }
    if (typeof content !== 'string') {
      return { ok: false, error: 'message content must be a string' };
    }
    value.push({ role, content: content.slice(0, MAX_MESSAGE_LENGTH) });
  }

  return { ok: true, value };
}
