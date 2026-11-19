import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentSection } from '../types/library';

// Configure PDF.js worker using Vite bundled asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsedPdfInfo {
  pdfDataUrl: string;
  pageCount: number;
  coverDataUrl: string;
  extractedSections: DocumentSection[];
  fileName: string;
  fileSizeLabel: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function loadPdfProxy(url: string) {
  const loadingTask = pdfjsLib.getDocument({
    url,
    cMapPacked: true,
  });
  return loadingTask.promise;
}

export async function inspectUploadedPdf(file: File): Promise<ParsedPdfInfo> {
  const pdfDataUrl = URL.createObjectURL(file);
  const pdfDoc = await loadPdfProxy(pdfDataUrl);
  const pageCount = pdfDoc.numPages;

  // Render Page 1 to an offscreen canvas to generate a clean cover thumbnail
  let coverDataUrl = '/src/assets/images/cover_beethoven_sonata_urtext_1795093346551.jpg';
  try {
    const firstPage = await pdfDoc.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const targetWidth = 480;
    const scale = targetWidth / baseViewport.width;
    const viewport = firstPage.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#FAF7F0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await firstPage.render({
        canvasContext: ctx,
        viewport,
        canvas,
      }).promise;
      coverDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    }
  } catch (err) {
    console.warn('Could not auto-generate PDF cover thumbnail:', err);
  }

  // Extract embedded PDF Outline / Bookmarks if available
  const extractedSections: DocumentSection[] = [];
  try {
    const outline = await pdfDoc.getOutline();
    if (outline && outline.length > 0) {
      for (let i = 0; i < Math.min(outline.length, 24); i++) {
        const item = outline[i];
        let startPage = 1;
        try {
          let dest = item.dest;
          if (typeof dest === 'string') {
            dest = await pdfDoc.getDestination(dest);
          }
          if (Array.isArray(dest) && dest[0]) {
            const pageIndex = await pdfDoc.getPageIndex(dest[0]);
            startPage = pageIndex + 1;
          }
        } catch {
          startPage = Math.min(i + 1, pageCount);
        }

        extractedSections.push({
          id: `pdf-sec-${Date.now()}-${i}`,
          indexLabel: `${String(i + 1).padStart(2, '0')}.`,
          title: item.title || `Bagian ${i + 1}`,
          tempoOrTopic: `Halaman ${startPage}`,
          startPage: Math.max(1, Math.min(pageCount, startPage)),
        });
      }
    }
  } catch (err) {
    console.warn('No embedded PDF outline found:', err);
  }

  // Fallback default opening section if PDF had no bookmarks
  if (extractedSections.length === 0) {
    extractedSections.push({
      id: `pdf-sec-${Date.now()}-0`,
      indexLabel: 'I.',
      title: 'Halaman Pembuka & Isi Utama',
      tempoOrTopic: `1–${pageCount} Halaman`,
      startPage: 1,
    });
  }

  return {
    pdfDataUrl,
    pageCount,
    coverDataUrl,
    extractedSections,
    fileName: file.name,
    fileSizeLabel: formatBytes(file.size),
  };
}
