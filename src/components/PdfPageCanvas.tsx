import React, { useEffect, useRef, useState } from 'react';
import { PaperTone } from '../types/library';
import { loadPdfProxy } from '../lib/pdfEngine';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PdfPageCanvasProps {
  pdfUrl: string;
  pageNumber: number;
  paperTone: PaperTone;
  zoom: number;
}

// Simple in-memory cache so flipping pages does not re-parse the same PDF repeatedly
const pdfDocCache = new Map<string, Promise<PDFDocumentProxy>>();

function getCachedPdf(url: string): Promise<PDFDocumentProxy> {
  let cached = pdfDocCache.get(url);
  if (!cached) {
    cached = loadPdfProxy(url);
    pdfDocCache.set(url, cached);
  }
  return cached;
}

export const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfUrl,
  pageNumber,
  paperTone,
  zoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    let activeRenderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const renderPage = async () => {
      setStatus('loading');
      setErrorMessage('');

      try {
        const pdfDoc = await getCachedPdf(pdfUrl);
        if (isCancelled) return;

        const safePageNum = Math.max(1, Math.min(pdfDoc.numPages, pageNumber));
        const page = await pdfDoc.getPage(safePageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Render at high-DPI retina sharpness so sheet music notation & text stay crystal clear
        const baseViewport = page.getViewport({ scale: 1 });
        const targetDisplayWidth = 620;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const zoomBoost = zoom > 115 ? 1.35 : 1.15;
        const renderScale = (targetDisplayWidth / baseViewport.width) * dpr * zoomBoost;

        const viewport = page.getViewport({ scale: renderScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas,
        });
        activeRenderTask = renderTask;

        await renderTask.promise;

        if (!isCancelled) {
          setStatus('ready');
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const errName =
          err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
        if (errName === 'RenderingCancelledException') return;

        console.error('PDF page render error:', err);
        setStatus('error');
        setErrorMessage('Gagal merender halaman PDF ini. Pastikan file PDF valid dan tidak rusak.');
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // Ignore cancellation cleanup
        }
      }
    };
  }, [pdfUrl, pageNumber, zoom]);

  // Optical blending rules to make standard white PDF pages match Apple archival paper tones
  const canvasOpticalClass =
    paperTone === 'ivory'
      ? 'mix-blend-multiply contrast-[1.03]'
      : paperTone === 'night'
      ? 'invert-[0.91] hue-rotate-180 sepia-[0.14] contrast-[0.96] opacity-95'
      : '';

  return (
    <div className="relative w-full flex items-center justify-center min-h-[680px]">
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-7 h-7 rounded-full border-2 border-[#0066CC]/30 border-t-[#0066CC] animate-spin" />
          <span className="font-tabular text-[11px] opacity-60">
            Merender Halaman {pageNumber} (HiDPI)...
          </span>
        </div>
      )}

      {status === 'error' ? (
        <div className="p-6 text-center space-y-2 max-w-sm">
          <div className="text-xs font-semibold text-[#B42318]">Gagal Memuat Halaman PDF</div>
          <p className="text-xs opacity-75">{errorMessage}</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={`w-full h-auto block transition-opacity duration-200 pointer-events-none ${
            status === 'ready' ? 'opacity-100' : 'opacity-0'
          } ${canvasOpticalClass}`}
        />
      )}
    </div>
  );
};
