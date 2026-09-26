// What each kind of account can actually do.
//
// A camp signing in used to be shown Incoming, Resources and History — three
// screens about ambulances arriving at a hospital, none of which a free eye
// camp has. It now gets its own two, and an administrator gets the queue.
//
// This also decides which routes each account may reach at all, so a camp
// cannot open /incoming by typing it.
export const NAV = {
  hospital: [
    { to: '/incoming', label: 'Incoming' },
    { to: '/resources', label: 'Resources' },
    { to: '/history', label: 'History' },
  ],
  medical_camp: [
    { to: '/camp/patients', label: 'Patients' },
    { to: '/camp', label: 'Camp details' },
  ],
  super_admin: [
    { to: '/admin/facilities', label: 'Registrations' },
  ],
};

/** 'super_admin' | 'medical_camp' | 'hospital' — what this account is. */
export function audienceOf(user, hospital) {
  if (user?.role === 'super_admin') return 'super_admin';
  if (hospital?.facility_type === 'medical_camp') return 'medical_camp';
  return 'hospital';
}

export function navFor(user, hospital) {
  return NAV[audienceOf(user, hospital)];
}

/** Where this account belongs when it lands on / or somewhere it may not go. */
export function homeFor(user, hospital) {
  return NAV[audienceOf(user, hospital)][0].to;
}
