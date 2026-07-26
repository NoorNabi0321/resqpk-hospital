import toast from 'react-hot-toast';

import { tone as toneStyle } from '../../lib/tones';

// Solid white card with a coloured left edge. Never translucent — a reception
// screen is bright, and a see-through toast sitting over buttons is unreadable.
export default function ToastCard({ t, tone, title, body, meta }) {
  const { edge, tint, Icon } = toneStyle(tone);
  return (
    <div
      onClick={() => toast.dismiss(t.id)}
      role="status"
      className={`flex items-start gap-3 w-[340px] p-3.5 rounded-[14px] cursor-pointer ${
        t.visible ? 'animate-slide-down' : 'opacity-0'
      }`}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E9F0',
        borderLeft: `4px solid ${edge}`,
        boxShadow: '0 4px 12px rgba(16,24,40,0.10)',
      }}
    >
      <span
        className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
        style={{ background: tint, color: edge }}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#111827] leading-snug">{title}</p>
        {body && <p className="text-xs text-[#4B5563] mt-0.5 leading-snug">{body}</p>}
        {meta && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{meta}</p>}
      </div>
    </div>
  );
}
