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

export const getAlternatives = (caseId) =>
  apiClient.get(`/api/resources/alternatives/${caseId}`).then(data);

// --- decisions --------------------------------------------------------------
export const acceptCase = (caseId, preparationNote) =>
  apiClient.post('/api/decisions/accept', { caseId, preparationNote }).then(data);

export const redirectCase = (caseId, newHospitalId, reason) =>
  apiClient.post('/api/decisions/redirect', { caseId, newHospitalId, reason }).then(data);

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

export default {
  getCase,
  getResources,
  updateResource,
  getResourceMatch,
  getAlternatives,
  acceptCase,
  redirectCase,
  sendQuickMessage,
  getCaseMessages,
  getDecisionConstants,
  getReportPdfUrl,
  getCampDashboard,
  registerCamp,
};
