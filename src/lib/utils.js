import clsx from 'clsx';

export function cn(...classes) {
  return clsx(...classes);
}

export function formatDuration(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
}

export function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getUrgencyColor(level) {
  switch (level?.toLowerCase()) {
    case 'critical':
      return { bg: 'bg-emergency-red/10', text: 'text-emergency-red', border: 'border-emergency-red' };
    case 'moderate':
      return { bg: 'bg-emergency-amber/10', text: 'text-emergency-amber', border: 'border-emergency-amber' };
    case 'low':
      return { bg: 'bg-emergency-green/10', text: 'text-emergency-green', border: 'border-emergency-green' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' };
  }
}

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// Normalizes a case object — handles snake_case (hospital:join embed) and
// camelCase (new_case socket payload) into one consistent shape.
export function normalizeCase(c) {
  const num = (v) => (v == null ? NaN : Number(v));
  return {
    id: c.id ?? c.caseId,
    caseNumber: c.case_number ?? c.caseNumber,
    status: c.status,
    urgency: c.urgency_level ?? c.ai_report?.urgency_level ?? c.urgencyLevel ?? 'unknown',
    emergencyType: c.emergency_type ?? c.ai_report?.emergency_type ?? c.emergencyType,
    patientLat: num(c.patient_lat ?? c.patientLat),
    patientLng: num(c.patient_lng ?? c.patientLng),
    patientName: c.patient?.full_name ?? c.patientName ?? 'Patient',
    driverId: c.driver_id ?? c.driverId ?? c.driver?.id,
    driverLat: num(c.driver?.current_lat ?? c.driver?.currentLat ?? c.driverLat),
    driverLng: num(c.driver?.current_lng ?? c.driver?.currentLng ?? c.driverLng),
    driverName: c.driver?.users?.full_name ?? c.driver?.fullName ?? c.driverName,
    vehicle: c.driver?.vehicle_number ?? c.driver?.vehicleNumber,
    driverPhone: c.driver?.users?.phone ?? c.driverPhone,
    patientPhone: c.patient?.phone ?? c.patientPhone,
    gender: c.patient?.medical_profiles?.gender ?? c.gender,
    age: ageFromDob(c.patient?.medical_profiles?.date_of_birth ?? c.dateOfBirth),
    bloodGroup: c.patient?.medical_profiles?.blood_group ?? c.bloodGroup,
    conditions: c.patient?.medical_profiles?.chronic_conditions ?? c.chronicConditions ?? [],
    allergies: c.patient?.medical_profiles?.allergies ?? c.allergies ?? [],
    consciousness: c.ai_report?.consciousness_state ?? c.consciousnessState,
    keyObservations: c.ai_report?.key_observations ?? c.keyObservations ?? [],
    firstAidSuggestion: c.ai_report?.first_aid_suggestion ?? c.firstAidSuggestion,
    hasAiReport: !!c.ai_report || c.has_ai_report === true || c.hasAiReport === true,
    etaSeconds: c.estimated_driver_arrival_seconds ?? c.etaSeconds,
    sosTriggeredAt: c.sos_triggered_at ?? c.sosTriggeredAt,
    driverAssignedAt: c.driver_assigned_at ?? c.driverAssignedAt,
    driverArrivedAt: c.driver_arrived_at ?? c.driverArrivedAt,
  };
}

export function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    searching: 'Searching Driver',
    driver_assigned: 'Driver En Route',
    en_route: 'Patient in Ambulance',
    arrived: 'Ambulance Arrived',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_driver_found: 'No Driver Found',
  };
  return labels[status] || status;
}
