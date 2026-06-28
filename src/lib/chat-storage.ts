// ─── ONE-LINE SWITCH ──────────────────────────────────────────────────────────
// false → localStorage (no backend needed)
// true  → MongoDB via API routes
const USE_DB_STORAGE = false;
// ─────────────────────────────────────────────────────────────────────────────

export type StoredMessage = { role: 'user' | 'assistant'; content: string };
export type ConversationMeta = { id: string; title: string; updatedAt: string };

interface StorageAdapter {
  listConversations(): Promise<ConversationMeta[]>;
  createConversation(title: string): Promise<ConversationMeta>;
  renameConversation(id: string, title: string): Promise<void>;
  getMessages(id: string): Promise<StoredMessage[]>;
  saveMessages(id: string, messages: StoredMessage[]): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}

// ── Local Storage adapter ─────────────────────────────────────────────────────
class LocalStorageAdapter implements StorageAdapter {
  private metaKey: string;
  private msgPrefix: string;

  constructor(userId: string) {
    const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    this.metaKey = `astro_${safe}_conversations`;
    this.msgPrefix = `astro_${safe}_msgs_`;
    if (typeof window !== 'undefined') this.migrateFromLegacy();
  }

  // One-time migration: move data stored under the old non-namespaced keys
  private migrateFromLegacy() {
    const LEGACY_META = 'astro_conversations';
    const LEGACY_MSG_PREFIX = 'astro_msgs_';
    const raw = localStorage.getItem(LEGACY_META);
    if (!raw) return;
    try {
      const old: ConversationMeta[] = JSON.parse(raw);
      if (!old.length) return;
      // Only migrate if the namespaced slot is empty (don't overwrite real data)
      if (this.getMeta().length === 0) {
        this.setMeta(old);
        for (const c of old) {
          const msgs = localStorage.getItem(`${LEGACY_MSG_PREFIX}${c.id}`);
          if (msgs) localStorage.setItem(`${this.msgPrefix}${c.id}`, msgs);
        }
      }
      // Clean up legacy keys regardless
      for (const c of old) localStorage.removeItem(`${LEGACY_MSG_PREFIX}${c.id}`);
      localStorage.removeItem(LEGACY_META);
    } catch { /* ignore */ }
  }

  private getMeta(): ConversationMeta[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(this.metaKey) || '[]'); } catch { return []; }
  }
  private setMeta(meta: ConversationMeta[]) {
    localStorage.setItem(this.metaKey, JSON.stringify(meta));
  }

  async listConversations() {
    return this.getMeta().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createConversation(title: string) {
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const meta: ConversationMeta = { id, title, updatedAt: new Date().toISOString() };
    this.setMeta([meta, ...this.getMeta()]);
    localStorage.setItem(`${this.msgPrefix}${id}`, '[]');
    return meta;
  }

  async renameConversation(id: string, title: string) {
    this.setMeta(this.getMeta().map(m => m.id === id ? { ...m, title } : m));
  }

  async getMessages(id: string) {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(`${this.msgPrefix}${id}`) || '[]'); } catch { return []; }
  }

  async saveMessages(id: string, messages: StoredMessage[]) {
    localStorage.setItem(`${this.msgPrefix}${id}`, JSON.stringify(messages));
    this.setMeta(
      this.getMeta()
        .map(m => m.id === id ? { ...m, updatedAt: new Date().toISOString() } : m)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  }

  async deleteConversation(id: string) {
    localStorage.removeItem(`${this.msgPrefix}${id}`);
    this.setMeta(this.getMeta().filter(m => m.id !== id));
  }
}

// ── DB adapter (calls API routes) ─────────────────────────────────────────────
class DBStorageAdapter implements StorageAdapter {
  async listConversations() {
    const res = await fetch('/api/conversations');
    return res.ok ? res.json() : [];
  }

  async createConversation(title: string) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.json();
  }

  async renameConversation(id: string, title: string) {
    await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }

  async getMessages(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    return res.ok ? res.json() : [];
  }

  async saveMessages(id: string, messages: StoredMessage[]) {
    await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  }

  async deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
  }
}

// ── Factory (cached per userId) ───────────────────────────────────────────────
const _cache = new Map<string, StorageAdapter>();

export function getChatStorage(userId: string): StorageAdapter {
  if (USE_DB_STORAGE) return new DBStorageAdapter();
  const key = userId || 'anon';
  if (!_cache.has(key)) {
    _cache.set(key, new LocalStorageAdapter(key));
  }
  return _cache.get(key)!;
}
