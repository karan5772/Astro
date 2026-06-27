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
  private metaKey = 'astro_conversations';

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
    localStorage.setItem(`astro_msgs_${id}`, '[]');
    return meta;
  }

  async renameConversation(id: string, title: string) {
    this.setMeta(this.getMeta().map(m => m.id === id ? { ...m, title } : m));
  }

  async getMessages(id: string) {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(`astro_msgs_${id}`) || '[]'); } catch { return []; }
  }

  async saveMessages(id: string, messages: StoredMessage[]) {
    localStorage.setItem(`astro_msgs_${id}`, JSON.stringify(messages));
    this.setMeta(
      this.getMeta()
        .map(m => m.id === id ? { ...m, updatedAt: new Date().toISOString() } : m)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  }

  async deleteConversation(id: string) {
    localStorage.removeItem(`astro_msgs_${id}`);
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

export const chatStorage: StorageAdapter = USE_DB_STORAGE
  ? new DBStorageAdapter()
  : new LocalStorageAdapter();
