import connectToDatabase from './mongodb';
import Event from './models/Event';

// Fire-and-forget analytics event logger — never throws, never blocks the caller.
export function logEvent(
  clerkId: string,
  type: string,
  metadata: Record<string, unknown> = {}
): void {
  connectToDatabase()
    .then(() => Event.create({ clerkId, type, metadata }))
    .catch(err => console.error('[logEvent]', type, err));
}
