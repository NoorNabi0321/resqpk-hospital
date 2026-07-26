import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Loader2 } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// react-pdf needs a worker; served from a CDN so no bundler config is required.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * Renders the AI report PDF inline. Falls back to an <iframe> if pdf.js fails
 * (blocked worker, unusual PDF) — the receptionist must always be able to read
 * the report, even when the fancy viewer cannot mount.
 */
export default function PdfReportViewer({ url }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(880);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Note: the caller passes key={url}, so a new document remounts this
  // component and gets a fresh attempt at the good viewer automatically.

  if (failed) {
    return (
      <iframe
        src={url}
        title="AI Emergency Report"
        className="w-full rounded-lg border border-line"
        style={{ height: 720 }}
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full animate-fade-in">
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={() => setFailed(true)}
        onSourceError={() => setFailed(true)}
        loading={
          <div className="h-[420px] grid place-items-center text-ink-muted">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading report…
            </div>
          </div>
        }
        error={
          <div className="h-[220px] grid place-items-center text-ink-muted text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} /> Could not display the PDF inline.
            </div>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={width}
            renderTextLayer
            renderAnnotationLayer={false}
            className="shadow-card rounded-lg overflow-hidden bg-white"
          />
        ))}
      </Document>
    </div>
  );
}
