// Thin wrappers over the v2 backend endpoints, so views never build URLs.
import apiClient from './client';

const data = (res) => res.data?.data;

// --- cases ------------------------------------------------------------------
export const getCase = (caseId) => apiClient.get(`/api/cases/${caseId}`).then(data);

// --- resources --------------------------------------------------------------
export const getResources = () => apiClient.get('/api/resources').then(data);

export const updateResource = (canonicalKey, payload) =>
  apiClient.put(`/api/resources/${canonicalKey}`, payload).then(data);

export const getResourceMatch = (caseId) =>
  apiClient.get(`/api/resources/match/${caseId}`).then(data);

// --- decisions --------------------------------------------------------------
export const sendQuickMessage = (caseId, messageKey) =>
  apiClient.post('/api/decisions/message', { caseId, messageKey }).then(data);

export const getCaseMessages = (caseId) =>
  apiClient.get(`/api/decisions/messages/${caseId}`).then(data);

// Presets are static per deploy — fetch once and reuse.
let constantsCache = null;
export async function getDecisionConstants() {
  if (constantsCache) return constantsCache;
  constantsCache = await apiClient.get('/api/decisions/constants').then(data);
  return constantsCache;
}

// --- reports ----------------------------------------------------------------
// Stored PDF URLs expire after 6 hours, so always mint a fresh one on open.
export const getReportPdfUrl = (caseId) =>
  apiClient.get(`/api/ai/report/${caseId}/pdf`).then((res) => data(res)?.pdfUrl);

// --- camps ------------------------------------------------------------------
export const getCampDashboard = () => apiClient.get('/api/camps/dashboard/me').then(data);

export const registerCamp = (payload) =>
  apiClient.post('/api/camps/register', payload).then(data);

// --- registration + administration ------------------------------------------
export const registerHospital = (payload) =>
  apiClient.post('/api/hospitals/register', payload).then(data);

export const listFacilities = (params) =>
  apiClient.get('/api/admin/facilities', { params }).then(data);

export const getPendingCount = () =>
  apiClient.get('/api/admin/facilities/pending-count').then(data);

export const approveFacility = (id) =>
  apiClient.post(`/api/admin/facilities/${id}/approve`).then(data);

export const rejectFacility = (id, reason) =>
  apiClient.post(`/api/admin/facilities/${id}/reject`, { reason }).then(data);

// --- camp patient register ---------------------------------------------------
export const listCampVisits = (params) =>
  apiClient.get('/api/camp-visits', { params }).then(data);

export const getCampVisitSummary = () =>
  apiClient.get('/api/camp-visits/summary').then(data);

export const createCampVisit = (payload) =>
  apiClient.post('/api/camp-visits', payload).then(data);

export const updateCampVisit = (id, payload) =>
  apiClient.put(`/api/camp-visits/${id}`, payload).then(data);

export const deleteCampVisit = (id) =>
  apiClient.delete(`/api/camp-visits/${id}`).then(data);

export const campVisitsCsvUrl = () => '/api/camp-visits/export.csv';

export default {
  registerHospital,
  listFacilities,
  getPendingCount,
  approveFacility,
  rejectFacility,
  listCampVisits,
  getCampVisitSummary,
  createCampVisit,
  updateCampVisit,
  deleteCampVisit,
  getCase,
  getResources,
  updateResource,
  getResourceMatch,
  sendQuickMessage,
  getCaseMessages,
  getDecisionConstants,
  getReportPdfUrl,
  getCampDashboard,
  registerCamp,
};
