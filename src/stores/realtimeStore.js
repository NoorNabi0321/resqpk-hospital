import { create } from 'zustand';

// Live dashboard state, fed by the Socket.io events in useHospitalSocket.
const useRealtimeStore = create((set) => ({
  isLive: false,
  activeCases: [], // case objects
  beds: [], // hospital_beds rows
  resources: null, // { equipment: [], specialist: [], service: [] }
  driverPositions: {}, // { driverId: { lat, lng, heading } }
  etaByCase: {}, // { caseId: { durationSeconds, durationText, receivedAt } }
  messagesByCase: {}, // { caseId: [ { senderRole, messageText, timestamp } ] }
  newReportCaseIds: [], // cases whose report just arrived (drives the pulse)
  lastEventAt: null, // ms timestamp of the most recent realtime update

  setLive: (v) => set({ isLive: v }),
  touch: () => set({ lastEventAt: Date.now() }),

  setInitialData: ({ activeCases, beds }) =>
    set({ activeCases: activeCases || [], beds: beds || [] }),

  addCase: (c) =>
    set((s) => {
      const id = c.id ?? c.caseId;
      if (s.activeCases.some((x) => (x.id ?? x.caseId) === id)) return {};
      return { activeCases: [c, ...s.activeCases] };
    }),

  updateCase: (caseId, patch) =>
    set((s) => ({
      activeCases: s.activeCases.map((c) =>
        (c.id ?? c.caseId) === caseId ? { ...c, ...patch } : c,
      ),
    })),

  // Used when a case leaves this hospital (redirected away) or finishes.
  removeCase: (caseId) =>
    set((s) => ({
      activeCases: s.activeCases.filter((c) => (c.id ?? c.caseId) !== caseId),
    })),

  updateDriverPosition: (driverId, pos) =>
    set((s) => ({ driverPositions: { ...s.driverPositions, [driverId]: pos } })),

  // receivedAt lets the card interpolate a per-second countdown between
  // socket updates instead of jumping only when the server speaks.
  updateEta: (caseId, eta) =>
    set((s) => ({
      etaByCase: { ...s.etaByCase, [caseId]: { ...eta, receivedAt: Date.now() } },
    })),

  // --- v2: decisions, messages, resources ------------------------------------

  markNewReport: (caseId) =>
    set((s) =>
      s.newReportCaseIds.includes(caseId)
        ? {}
        : { newReportCaseIds: [...s.newReportCaseIds, caseId] },
    ),

  clearNewReport: (caseId) =>
    set((s) => ({ newReportCaseIds: s.newReportCaseIds.filter((id) => id !== caseId) })),

  appendMessage: (caseId, message) =>
    set((s) => ({
      messagesByCase: {
        ...s.messagesByCase,
        [caseId]: [...(s.messagesByCase[caseId] || []), message],
      },
    })),

  setMessages: (caseId, messages) =>
    set((s) => ({ messagesByCase: { ...s.messagesByCase, [caseId]: messages || [] } })),

  setResources: (resources) => set({ resources }),

  // A single resource toggled on another reception screen.
  patchResource: ({ canonicalKey, status, quantity, updatedAt }) =>
    set((s) => {
      if (!s.resources) return {};
      const next = {};
      for (const [group, rows] of Object.entries(s.resources)) {
        next[group] = rows.map((r) =>
          r.canonical_key === canonicalKey
            ? { ...r, status, quantity, updated_at: updatedAt ?? r.updated_at }
            : r,
        );
      }
      return { resources: next };
    }),

  upsertBed: (bed) =>
    set((s) => {
      const beds = [...s.beds];
      const idx = beds.findIndex((b) => b.bed_type === bed.bedType);
      const row = {
        bed_type: bed.bedType,
        available_count: bed.availableCount,
        reserved_count: bed.reservedCount,
      };
      if (idx >= 0) beds[idx] = { ...beds[idx], ...row };
      else beds.push(row);
      return { beds };
    }),

  reset: () =>
    set({
      isLive: false,
      activeCases: [],
      beds: [],
      resources: null,
      driverPositions: {},
      etaByCase: {},
      messagesByCase: {},
      newReportCaseIds: [],
      lastEventAt: null,
    }),
}));

export default useRealtimeStore;
