import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  Phone,
  XCircle,
} from 'lucide-react';

import {
  getCase,
  getResourceMatch,
  getCaseMessages,
  getDecisionConstants,
  getReportPdfUrl,
  sendQuickMessage,
} from '../../api/v2';
import useRealtimeStore from '../../stores/realtimeStore';
import useNow from '../../hooks/useNow';
import { normalizeCase, liveEtaSeconds, formatEtaClock, formatTime } from '../../lib/utils';
import PdfReportViewer from '../../components/decisions/PdfReportViewer';

function Card({ children, className = '' }) {
  return <section className={`v2-card p-5 ${className}`}>{children}</section>;
}

function Chip({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-ink-soft',
    red: 'bg-critical-tint text-critical',
    amber: 'bg-decision-tint text-decision',
    blue: 'bg-info-tint text-info',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${tones[tone]}`}>{children}</span>
  );
}

const CHECK_ICON = {
  ok: <CheckCircle2 size={15} className="text-ready shrink-0" />,
  limited: <AlertTriangle size={15} className="text-decision shrink-0" />,
  missing: <XCircle size={15} className="text-critical shrink-0" />,
  unknown: <HelpCircle size={15} className="text-ink-faint shrink-0" />,
};

const CHECK_TEXT = {
  ok: 'text-ready',
  limited: 'text-decision',
  missing: 'text-critical',
  unknown: 'text-ink-muted',
};

export default function CaseDetailView() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const now = useNow(1000);

  const etaByCase = useRealtimeStore((s) => s.etaByCase);
  const storeMessages = useRealtimeStore((s) => s.messagesByCase[caseId]);
  const setMessages = useRealtimeStore((s) => s.setMessages);
  const clearNewReport = useRealtimeStore((s) => s.clearNewReport);
  const newReportCaseIds = useRealtimeStore((s) => s.newReportCaseIds);

  const [sendingKey, setSendingKey] = useState(null);

  const caseQuery = useQuery({ queryKey: ['case', caseId], queryFn: () => getCase(caseId) });
  const c = useMemo(() => (caseQuery.data ? normalizeCase(caseQuery.data) : null), [caseQuery.data]);

  const hasReport = !!c?.hasAiReport;
  const reportArrived = newReportCaseIds.includes(caseId);

  // reportArrived in the key means a freshly delivered report refetches both.
  const matchQuery = useQuery({
    queryKey: ['match', caseId, reportArrived],
    queryFn: () => getResourceMatch(caseId),
    enabled: hasReport,
  });

  const pdfQuery = useQuery({
    queryKey: ['pdf', caseId, reportArrived],
    queryFn: () => getReportPdfUrl(caseId),
    enabled: hasReport,
    retry: false,
  });

  const constantsQuery = useQuery({
    queryKey: ['decision-constants'],
    queryFn: getDecisionConstants,
    staleTime: Infinity,
  });

  // Seed the feed once; socket events append to it from there.
  useEffect(() => {
    let cancelled = false;
    getCaseMessages(caseId)
      .then((rows) => !cancelled && setMessages(caseId, rows))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [caseId, setMessages]);

  // Opening the case counts as reviewing it — stop the card pulsing.
  useEffect(() => {
    if (reportArrived) clearNewReport(caseId);
  }, [reportArrived, caseId, clearNewReport]);

  const messages = storeMessages || [];
  const etaSeconds = liveEtaSeconds(etaByCase[caseId], now) ?? c?.etaSeconds ?? null;
  const readOnly = ['completed', 'cancelled'].includes(c?.status);

  const hospitalMessages = useMemo(() => {
    const all = constantsQuery.data?.quickMessages || {};
    return Object.values(all).filter((m) => m.role === 'hospital');
  }, [constantsQuery.data]);

  const handleQuickMessage = async (key) => {
    setSendingKey(key);
    try {
      await sendQuickMessage(caseId, key);
      // The socket broadcast appends it to everyone's feed.
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message failed to send');
    } finally {
      setSendingKey(null);
    }
  };

  if (caseQuery.isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto h-64 grid place-items-center text-ink-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading case…
        </div>
      </div>
    );
  }

  if (caseQuery.isError || !c) {
    return (
      <div className="max-w-[1100px] mx-auto v2-card p-10 text-center">
        <p className="text-ink-muted mb-4">This case could not be loaded.</p>
        <button onClick={() => navigate('/incoming')} className="text-info font-medium text-sm">
          Back to Incoming
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto pb-28">
      {/* Sticky header */}
      <div className="sticky top-14 z-30 -mx-4 px-4 py-3 bg-page/95 backdrop-blur border-b border-line mb-4">
        <div className="max-w-[1100px] mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/incoming')}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to Incoming
          </button>
          <span className="text-sm font-medium">{c.caseNumber}</span>
          <div className="ml-auto flex items-center gap-3">
            {!readOnly && <span className="text-eta tabular-nums">{formatEtaClock(etaSeconds)}</span>}
{/* This said Awaiting decision / Accepted / Redirected. The ward does
                not decide whether to take an ambulance that is already on its
                way, so the pill says where the case has got to instead. */}
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-ready-tint text-ready">
              Incoming
            </span>
          </div>
        </div>
      </div>

      {/* Patient + driver */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">
            Patient
          </h2>
          <p className="text-xl font-semibold">{c.patientName}</p>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {(c.gender || c.age != null) && (
              <span className="text-sm text-ink-muted">
                {[c.gender, c.age != null ? `${c.age} yrs` : null].filter(Boolean).join(' · ')}
              </span>
            )}
            {c.bloodGroup && <Chip tone="red">{c.bloodGroup}</Chip>}
          </div>
          {(c.conditions?.length > 0 || c.allergies?.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {c.conditions.map((x) => (
                <Chip key={x} tone="red">
                  {x}
                </Chip>
              ))}
              {c.allergies.map((x) => (
                <Chip key={x} tone="amber">
                  Allergy: {x}
                </Chip>
              ))}
            </div>
          )}
          {c.address && <p className="text-xs text-ink-muted mt-3">{c.address}</p>}
          {c.patientPhone && (
            <a
              href={`tel:${c.patientPhone}`}
              className="inline-flex items-center gap-1.5 text-sm text-info mt-3 hover:underline"
            >
              <Phone size={14} /> {c.patientPhone}
            </a>
          )}
        </Card>

        <Card>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">
            Driver
          </h2>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-card-title">{c.driverName || 'Assigning…'}</p>
              <p className="text-sm text-ink-muted">{c.vehicle}</p>
            </div>
            {c.driverPhone && (
              <a
                href={`tel:${c.driverPhone}`}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line text-sm text-ink-soft hover:bg-page"
              >
                <Phone size={14} /> Call
              </a>
            )}
          </div>

          <p className="text-xs text-ink-muted mt-2">Status: {c.status?.replace(/_/g, ' ')}</p>

          {/* Message feed */}
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">
              Messages
            </p>
            <div className="h-[140px] overflow-y-auto flex flex-col gap-1.5 pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-ink-faint">No messages yet.</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={`${m.created_at}-${i}`}
                    className={`flex ${m.sender_role === 'hospital' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={[
                        'px-2.5 py-1.5 rounded-lg text-xs max-w-[85%]',
                        m.sender_role === 'hospital'
                          ? 'bg-info-tint text-info'
                          : 'bg-gray-100 text-ink-soft',
                      ].join(' ')}
                    >
                      {m.message_text}
                      <span className="block text-[10px] opacity-60 mt-0.5">
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Resource check */}
      {hasReport && (
        <Card className="mb-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-3">
            Resource check for this case
          </h2>
          {matchQuery.isLoading ? (
            <p className="text-sm text-ink-muted">Checking resources…</p>
          ) : matchQuery.data?.checks?.length ? (
            <>
              <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
                {matchQuery.data.checks.map((chk) => (
                  <div key={chk.needed} className="flex items-start gap-2 text-sm">
                    {CHECK_ICON[chk.status]}
                    <span className={CHECK_TEXT[chk.status]}>
                      <span className="font-medium">{chk.resource || chk.needed}</span>
                      {chk.status === 'ok' && chk.quantity != null && ` — available (${chk.quantity})`}
                      {chk.status !== 'ok' && chk.note && ` — ${chk.note}`}
                    </span>
                  </div>
                ))}
              </div>
              <p
                className={`mt-3 pt-3 border-t border-line text-sm font-medium ${
                  matchQuery.data.overallOk ? 'text-ready' : 'text-critical'
                }`}
              >
                {matchQuery.data.summary}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">No specific resources identified.</p>
          )}
        </Card>
      )}

      {/* PDF — the centrepiece */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="inline-flex items-center gap-2 font-semibold">
            <FileText size={17} className="text-info" /> AI Emergency Report
          </h2>
          {pdfQuery.data && (
            <a
              href={pdfQuery.data}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line text-sm text-ink-soft hover:bg-page"
            >
              <Download size={14} /> Download PDF
            </a>
          )}
        </div>

        {!hasReport ? (
          <div className="min-h-[320px] rounded-lg border-2 border-dashed border-line grid place-items-center text-center px-6">
            <div>
              <p className="text-ink-soft font-medium">No report received yet</p>
              <p className="text-sm text-ink-muted mt-1">
                It will appear here instantly when the patient sends it.
              </p>
            </div>
          </div>
        ) : pdfQuery.isLoading ? (
          <div className="min-h-[320px] grid place-items-center text-ink-muted">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin" /> Preparing report…
            </div>
          </div>
        ) : pdfQuery.data ? (
          // key={url} remounts the viewer for a new document, resetting its
          // page count and any prior render failure.
          <PdfReportViewer key={pdfQuery.data} url={pdfQuery.data} />
        ) : (
          <div className="min-h-[200px] grid place-items-center text-center text-sm text-ink-muted px-6">
            The report exists but its PDF is unavailable. The structured details above still apply.
          </div>
        )}
      </Card>

      {/* Message bar.
          Accept, Redirect and the preparation-note popover used to be here.
          A ward that has been told what is arriving and when can have the bay
          ready; deciding in an app, minutes out, against resource figures
          nobody was updating was never the reliable half of that. What is left
          is the half that was: talking to the crew on the way in. */}
      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-line shadow-bar">
          <div className="max-w-[1100px] mx-auto px-4 py-3">
            <div className="flex flex-col gap-2.5">
                {/* Quick messages */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {hospitalMessages.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => handleQuickMessage(m.key)}
                      disabled={sendingKey === m.key}
                      className="px-2.5 py-1 rounded-lg border border-line text-[11px] text-ink-soft hover:bg-page disabled:opacity-50 transition"
                    >
                      {sendingKey === m.key ? '…' : m.text}
                    </button>
                  ))}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
