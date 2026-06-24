import { create } from 'zustand';

// Live dashboard state, fed by the Socket.io events in useHospitalSocket.
const useRealtimeStore = create((set) => ({
  isLive: false,
  activeCases: [], // case objects
  beds: [], // hospital_beds rows
  driverPositions: {}, // { driverId: { lat, lng, heading } }
  etaByCase: {}, // { caseId: { durationSeconds, durationText } }
  lastEventAt: null, // ms timestamp of the most recent realtime update

  setLive: (v) => set({ isLive: v }),
  touch: () => set({ lastEventAt: Date.now() }),

  setInitialData: ({ activeCases, beds }) =>
    set({ activeCases: activeCases || [], beds: beds || [] }),

  addCase: (c) =>
    set((s) => (s.activeCases.some((x) => x.id === c.id) ? {} : { activeCases: [c, ...s.activeCases] })),

  updateCase: (caseId, patch) =>
    set((s) => ({
      activeCases: s.activeCases.map((c) => (c.id === caseId ? { ...c, ...patch } : c)),
    })),

  updateDriverPosition: (driverId, pos) =>
    set((s) => ({ driverPositions: { ...s.driverPositions, [driverId]: pos } })),

  updateEta: (caseId, eta) => set((s) => ({ etaByCase: { ...s.etaByCase, [caseId]: eta } })),

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
      driverPositions: {},
      etaByCase: {},
      lastEventAt: null,
    }),
}));

export default useRealtimeStore;
