import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, Info, Loader2, MapPin, Phone } from 'lucide-react';

import { getCampDashboard } from '../../api/v2';

function Card({ children, className = '' }) {
  return <section className={`v2-card p-5 ${className}`}>{children}</section>;
}

function ApprovalBanner({ isApproved, visibleToPatients, daysRemaining }) {
  if (!isApproved) {
    return (
      <div className="rounded-lg bg-decision-tint border border-decision/30 px-4 py-3">
        <p className="text-sm font-medium text-decision">Pending approval</p>
        <p className="text-xs text-decision/80 mt-0.5">
          Your camp is not yet visible to patients. You will appear in the app once approved.
        </p>
      </div>
    );
  }
  if (visibleToPatients) {
    return (
      <div className="rounded-lg bg-ready-tint border border-ready/30 px-4 py-3">
        <p className="text-sm font-medium text-ready">Live — visible to nearby patients</p>
        <p className="text-xs text-ready/80 mt-0.5">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-gray-100 border border-line px-4 py-3">
      <p className="text-sm font-medium text-ink-soft">Camp dates ended — not visible</p>
      <p className="text-xs text-ink-muted mt-0.5">
        Patients can no longer find this camp in the app.
      </p>
    </div>
  );
}

export default function CampDashboardView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['camp-dashboard'],
    queryFn: getCampDashboard,
  });

  if (isLoading) {
    return (
      <div className="max-w-[640px] mx-auto h-48 grid place-items-center text-ink-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading camp…
        </div>
      </div>
    );
  }

  if (isError || !data?.camp) {
    return (
      <div className="max-w-[640px] mx-auto v2-card p-8 text-center text-ink-muted">
        This account is not linked to a medical camp.
      </div>
    );
  }

  const { camp, isApproved, daysRemaining, visibleToPatients } = data;

  return (
    <div className="max-w-[640px] mx-auto flex flex-col gap-4">
      {/* Status */}
      <Card>
        <h1 className="text-xl font-semibold">{camp.name}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{camp.organizerName}</p>
        <div className="mt-4">
          <ApprovalBanner
            isApproved={isApproved}
            visibleToPatients={visibleToPatients}
            daysRemaining={daysRemaining}
          />
        </div>
      </Card>

      {/* Details */}
      <Card>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-3">
          Camp details
        </h2>

        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarDays size={15} className="text-ink-faint mt-0.5 shrink-0" />
            <span>
              {camp.startDate} → {camp.endDate}
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin size={15} className="text-ink-faint mt-0.5 shrink-0" />
            <span>{camp.address}</span>
          </div>
          {camp.contactPhone && (
            <div className="flex items-start gap-2.5">
              <Phone size={15} className="text-ink-faint mt-0.5 shrink-0" />
              <a href={`tel:${camp.contactPhone}`} className="text-info hover:underline">
                {camp.contactPhone}
              </a>
            </div>
          )}
        </div>

        {camp.servicesOffered?.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">
              Services offered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {camp.servicesOffered.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-info-tint text-info text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {camp.description && (
          <p className="text-sm text-ink-soft mt-4 leading-relaxed">{camp.description}</p>
        )}
      </Card>

      {/* How discovery works */}
      <Card className="bg-info-tint border-info/20">
        <div className="flex items-start gap-2.5">
          <Info size={16} className="text-info mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-info">How patients find you</p>
            <p className="text-xs text-info/80 mt-1 leading-relaxed">
              Your camp appears in the ResQPK app&apos;s Nearby Camps section for users within
              25 km, during your camp dates.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-xs text-ink-faint text-center inline-flex items-center justify-center gap-1.5 pb-4">
        <Clock size={12} /> Camps are discovery-only — no emergency cases are routed here.
      </p>
    </div>
  );
}
