import { create } from 'zustand';

// Keeps a rolling log of everything that popped up as a toast, so a
// receptionist who stepped away can see what they missed and when.
const MAX_ITEMS = 50;

let nextId = 1;

const useNotificationStore = create((set, get) => ({
  items: [], // { id, tone, title, body, at, read, caseId }
  panelOpen: false,

  push: ({ tone = 'info', title, body = null, caseId = null }) => {
    const item = { id: nextId++, tone, title, body, caseId, at: Date.now(), read: false };
    set((s) => ({ items: [item, ...s.items].slice(0, MAX_ITEMS) }));
    return item.id;
  },

  unreadCount: () => get().items.filter((i) => !i.read).length,

  markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),

  togglePanel: () =>
    set((s) => {
      // Opening the panel is how they are read.
      if (!s.panelOpen) return { panelOpen: true, items: s.items.map((i) => ({ ...i, read: true })) };
      return { panelOpen: false };
    }),

  closePanel: () => set({ panelOpen: false }),

  clear: () => set({ items: [] }),
}));

export default useNotificationStore;
