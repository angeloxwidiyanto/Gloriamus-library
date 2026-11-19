import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Info,
  Camera,
  EyeOff,
} from 'lucide-react';
import {
  LibraryDocument,
  PaperTone,
  UserSession,
  DocumentPage,
  SecurityEventLog,
} from '../types/library';
import { ScoreNotationCanvas } from './ScoreNotationCanvas';
import { PdfPageCanvas } from './PdfPageCanvas';

interface StudioScoreReaderProps {
  document: LibraryDocument;
  initialPage?: number;
  userSession: UserSession;
  onClose: () => void;
  onOpenInspector: (doc: LibraryDocument) => void;
  onOpenAuthModal: () => void;
  onLogSecurityEvent: (event: Omit<SecurityEventLog, 'id' | 'timestamp'>) => void;
}

export const StudioScoreReader: React.FC<StudioScoreReaderProps> = ({
  document,
  initialPage = 1,
  userSession,
  onClose,
  onOpenInspector,
  onOpenAuthModal,
  onLogSecurityEvent,
}) => {
  const isRealPdf = document.sourceType === 'uploaded_pdf' && Boolean(document.pdfDataUrl);
  const totalPages = isRealPdf
    ? Math.max(1, document.pageCount)
    : Math.max(1, document.pages.length);

  const [currentPage, setCurrentPage] = useState<number>(
    Math.max(1, Math.min(totalPages, initialPage))
  );
  const [zoom, setZoom] = useState<number>(100);
  const [spreadMode, setSpreadMode] = useState<'single' | 'dual'>('dual');
  const [paperTone, setPaperTone] = useState<PaperTone>('ivory');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [hudToast, setHudToast] = useState<{
    type: 'blocked' | 'authorized';
    title: string;
    detail: string;
  } | null>(null);

  // Sync page when initialPage or document changes
  useEffect(() => {
    setCurrentPage(Math.max(1, Math.min(totalPages, initialPage)));
  }, [document.id, initialPage, totalPages]);

  // Responsive check: default to single page on narrow screens
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSpreadMode('single');
      setIsTocOpen(false);
    }
  }, []);

  const triggerHudNotification = useCallback(
    (type: 'blocked' | 'authorized', title: string, detail: string) => {
      setHudToast({ type, title, detail });
    },
    []
  );

  useEffect(() => {
    if (!hudToast) return;
    const timer = window.setTimeout(() => {
      setHudToast(null);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [hudToast]);

  // Navigate pages safely
  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(totalPages, target));
      setCurrentPage(clamped);
    },
    [totalPages]
  );

  const handleNextPage = useCallback(() => {
    const step = spreadMode === 'dual' && currentPage + 1 < totalPages ? 2 : 1;
    goToPage(currentPage + step);
  }, [currentPage, spreadMode, totalPages, goToPage]);

  const handlePrevPage = useCallback(() => {
    const step = spreadMode === 'dual' && currentPage > 2 ? 2 : 1;
    goToPage(currentPage - step);
  }, [currentPage, spreadMode, goToPage]);

  // Simulate or handle screenshot attempt
  const handleScreenshotAttempt = useCallback(
    (sourceLabel: string) => {
      if (!userSession.isLoggedIn || !userSession.canScreenshot) {
        onLogSecurityEvent({
          actionType: 'SHORTCUT_CAPTURE_BLOCKED',
          message: `Percobaan screenshot (${sourceLabel}) pada "${document.title}" (hlm. ${currentPage}) diblokir karena akun belum memiliki hak akses tangkapan layar.`,
          userRole: userSession.role,
          userName: userSession.name,
          documentTitle: document.title,
        });
        triggerHudNotification(
          'blocked',
          'Tangkapan Layar Diblokir (DRM Active)',
          userSession.isLoggedIn
            ? 'Akun Anda saat ini tidak memiliki izin tangkapan layar. Pustakawan dapat mengaktifkan izin ini di panel Admin Gloriamus Library.'
            : 'Anda belum login. Silakan masuk dengan akun yang telah diberi hak akses tangkapan layar oleh pustakawan.'
        );
      } else {
        onLogSecurityEvent({
          actionType: 'AUTHORIZED_CAPTURE_WATERMARKED',
          message: `Tangkapan layar terotorisasi (${sourceLabel}) pada halaman ${currentPage} dengan watermark lisensi ${userSession.licenseToken}.`,
          userRole: userSession.role,
          userName: userSession.name,
          documentTitle: document.title,
        });
        triggerHudNotification(
          'authorized',
          'Tangkapan Layar Terotorisasi (Watermark Aktif)',
          `Diizinkan untuk ${userSession.name}. Watermark lisensi ${userSession.licenseToken} telah disematkan pada halaman.`
        );
      }
    },
    [userSession, document.title, currentPage, onLogSecurityEvent, triggerHudNotification]
  );

  // Keyboard navigation & DRM shortcut interception
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPage();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPage();
        return;
      }
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Block Ctrl/Cmd + S (Save PDF) and Ctrl/Cmd + P (Print PDF) unconditionally
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        onLogSecurityEvent({
          actionType: 'PRINT_EXPORT_BLOCKED',
          message: `Percobaan unduh/cetak pintasan (Ctrl/Cmd+${e.key.toUpperCase()}) pada "${document.title}" dicegah demi hak cipta penulis.`,
          userRole: userSession.role,
          userName: userSession.name,
          documentTitle: document.title,
        });
        triggerHudNotification(
          'blocked',
          'Unduh & Cetak Dokumen Dinonaktifkan',
          'Dokumen ini tidak dapat diunduh atau dicetak langsung untuk menjaga hak cipta penulis dan penerbit.'
        );
        return;
      }

      const isPrintScreen = e.key === 'PrintScreen';
      const isMacCapture =
        e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5');
      const isWinSnip = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's';

      if (isPrintScreen || isMacCapture || isWinSnip) {
        if (!userSession.canScreenshot) {
          e.preventDefault();
          e.stopPropagation();
        }
        handleScreenshotAttempt(isPrintScreen ? 'PrintScreen' : 'System Capture Shortcut');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextPage,
    handlePrevPage,
    onClose,
    userSession,
    document.title,
    onLogSecurityEvent,
    triggerHudNotification,
    handleScreenshotAttempt,
  ]);

  // Window Blur / Snipping Tool Focus Loss Protection when user lacks screenshot permission
  useEffect(() => {
    const handleWindowBlur = () => {
      if (!userSession.canScreenshot) {
        setIsWindowBlurred(true);
        onLogSecurityEvent({
          actionType: 'FOCUS_BLUR_SHIELD',
          message: `Perisai privasi anti-snipping diaktifkan otomatis saat jendela kehilangan fokus pada halaman ${currentPage}.`,
          userRole: userSession.role,
          userName: userSession.name,
          documentTitle: document.title,
        });
      }
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [userSession.canScreenshot, userSession.role, userSession.name, document.title, currentPage, onLogSecurityEvent]);

  // Intercept Right-Click Context Menu on the document stage
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogSecurityEvent({
      actionType: 'RIGHT_CLICK_BLOCKED',
      message: `Klik kanan pada halaman ${currentPage} ("${document.title}") diblokir.`,
      userRole: userSession.role,
      userName: userSession.name,
      documentTitle: document.title,
    });
    triggerHudNotification(
      'blocked',
      'Menu Konteks & Simpan Gambar Dinonaktifkan',
      'Penyalinan langsung dan pengunduhan berkas dinonaktifkan untuk melindungi hak cipta penulis.'
    );
  };

  // Determine page numbers to display (Single vs Two-Page Spread)
  const visiblePageNumbers: number[] = [currentPage];
  if (spreadMode === 'dual' && currentPage < totalPages) {
    visiblePageNumbers.push(currentPage + 1);
  }

  // Active section determination for TOC highlighting
  const activeSectionId = (() => {
    let matched = document.sections[0]?.id || '';
    for (const sec of document.sections) {
      if (sec.startPage <= currentPage) {
        matched = sec.id;
      }
    }
    return matched;
  })();

  // Paper Theme Surface Styling
  const paperStyles: Record<
    PaperTone,
    {
      stageBg: string;
      pageBg: string;
      pageText: string;
      pageMuted: string;
      pageBorder: string;
      watermarkColor: string;
    }
  > = {
    ivory: {
      stageBg: 'bg-[#E8E4DC] dark:bg-[#111113]',
      pageBg: 'bg-[#FAF7F0]',
      pageText: 'text-[#1C1917]',
      pageMuted: 'text-[#635E56]',
      pageBorder: 'border-[#DFD8C8]',
      watermarkColor: 'rgba(140, 98, 57, 0.12)',
    },
    alabaster: {
      stageBg: 'bg-[#E5E5EA] dark:bg-[#111113]',
      pageBg: 'bg-[#FFFFFF]',
      pageText: 'text-[#111113]',
      pageMuted: 'text-[#6E6E73]',
      pageBorder: 'border-[#E5E5EA]',
      watermarkColor: 'rgba(0, 102, 204, 0.1)',
    },
    night: {
      stageBg: 'bg-[#09090B]',
      pageBg: 'bg-[#161618]',
      pageText: 'text-[#EAE6DF]',
      pageMuted: 'text-[#9E9A92]',
      pageBorder: 'border-[#2A2A2E]',
      watermarkColor: 'rgba(212, 163, 115, 0.12)',
    },
  };

  const currentPaper = paperStyles[paperTone];

  // Dynamic Watermark String (Branded to Gloriamus Library)
  const watermarkIdentity = userSession.isLoggedIn
    ? `${userSession.name.toUpperCase()} · ${userSession.email} · ${userSession.licenseToken}`
    : `GLORIAMUS LIBRARY PROTECTED PREVIEW · NO SCREENSHOT OR DOWNLOAD · ${document.accessionNumber}`;

  const renderPageSheet = (pageNum: number, isRightSpreadPage: boolean) => {
    const samplePage: DocumentPage | undefined = !isRealPdf
      ? document.pages.find((p) => p.pageNumber === pageNum) || document.pages[0]
      : undefined;

    return (
      <div
        key={`sheet-${document.id}-${pageNum}`}
        className={`relative w-full max-w-[680px] min-h-[860px] ${currentPaper.pageBg} ${currentPaper.pageText} border ${currentPaper.pageBorder} shadow-[0_20px_50px_rgba(0,0,0,0.14)] rounded-sm ${
          isRealPdf ? 'p-5 sm:p-7' : 'p-7 sm:p-10'
        } flex flex-col justify-between overflow-hidden transition-colors duration-200`}
      >
        {/* Center Book Spine Shadow in Dual-Page Mode */}
        {spreadMode === 'dual' && (
          <div
            className={`pointer-events-none absolute top-0 bottom-0 w-10 z-20 ${
              isRightSpreadPage
                ? 'left-0 bg-gradient-to-r from-black/14 via-black/3 to-transparent'
                : 'right-0 bg-gradient-to-l from-black/14 via-black/3 to-transparent'
            }`}
          />
        )}

        {/* Dynamic Diagonal Multi-Layer Reader Watermark */}
        <div
          className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-around items-center overflow-hidden select-none"
          aria-hidden="true"
        >
          {[0, 1, 2].map((rowIdx) => (
            <div
              key={rowIdx}
              className="-rotate-24 whitespace-nowrap font-tabular text-[11px] font-semibold tracking-[0.22em] uppercase py-6"
              style={{ color: currentPaper.watermarkColor }}
            >
              {watermarkIdentity} &nbsp; • &nbsp; {watermarkIdentity}
            </div>
          ))}
        </div>

        {/* Top Running Archival Header */}
        <div className="relative z-10 flex-1 flex flex-col">
          <div
            className={`flex items-center justify-between pb-2.5 mb-4 border-b ${currentPaper.pageBorder} text-[10px] font-tabular tracking-widest uppercase ${currentPaper.pageMuted}`}
          >
            <span className="truncate pr-3">
              {isRealPdf
                ? `GLORIAMUS LIBRARY · ${document.creator.toUpperCase()} — ${document.title.toUpperCase()}`
                : samplePage?.runningHeader}
            </span>
            <span className="shrink-0">
              {document.catalogNumber} · HLM. {pageNum}
            </span>
          </div>

          {/* Real Uploaded PDF Canvas vs Curated Vector/Treatise Content */}
          {isRealPdf && document.pdfDataUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <PdfPageCanvas
                pdfUrl={document.pdfDataUrl}
                pageNumber={pageNum}
                paperTone={paperTone}
                zoom={zoom}
              />
            </div>
          ) : samplePage ? (
            <>
              {samplePage.titleOnPage && (
                <div className="text-center mb-7 pb-4 border-b border-current/10 space-y-1.5">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
                    {samplePage.titleOnPage}
                  </h2>
                  {samplePage.subtitleOnPage && (
                    <p
                      className={`font-editorial italic text-sm sm:text-base ${currentPaper.pageMuted}`}
                    >
                      {samplePage.subtitleOnPage}
                    </p>
                  )}
                  {samplePage.composerOrAuthorOnPage && (
                    <p className="text-[11px] font-tabular uppercase tracking-widest pt-1 opacity-80">
                      {samplePage.composerOrAuthorOnPage}
                    </p>
                  )}
                </div>
              )}

              {samplePage.proseParagraphs && samplePage.proseParagraphs.length > 0 && (
                <div className="space-y-4 my-3 max-w-[65ch] mx-auto">
                  {samplePage.proseParagraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      className={`text-[14.5px] leading-[1.82] text-justify ${
                        pIdx === 0 && samplePage.titleOnPage
                          ? 'first-letter:float-left first-letter:font-editorial first-letter:text-5xl first-letter:font-bold first-letter:pr-3 first-letter:leading-none first-letter:text-[#8C6239]'
                          : ''
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {samplePage.pullQuote && (
                <blockquote className="my-7 py-4 px-5 border-t border-b border-current/15 text-center">
                  <p className="font-editorial italic text-lg sm:text-xl leading-relaxed">
                    {samplePage.pullQuote}
                  </p>
                </blockquote>
              )}

              {samplePage.scoreSystems && samplePage.scoreSystems.length > 0 && (
                <div className="space-y-4 mt-2">
                  {samplePage.scoreSystems.map((sys, sIdx) => (
                    <ScoreNotationCanvas
                      key={`${samplePage.pageNumber}-sys-${sIdx}`}
                      system={sys}
                      paperTone={paperTone}
                      systemIndex={sIdx}
                    />
                  ))}
                </div>
              )}

              {samplePage.figureCaption && (
                <div
                  className={`mt-3 text-center font-editorial italic text-xs ${currentPaper.pageMuted}`}
                >
                  {samplePage.figureCaption}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Bottom Footnotes & Copyright Edition Stamp */}
        <div className="relative z-10 pt-4 mt-5 border-t border-current/10 space-y-2">
          {!isRealPdf && samplePage?.footnotes && samplePage.footnotes.length > 0 && (
            <div className={`space-y-1 text-[11px] leading-snug ${currentPaper.pageMuted}`}>
              {samplePage.footnotes.map((fn, idx) => (
                <p key={idx}>{fn}</p>
              ))}
            </div>
          )}

          <div
            className={`flex items-center justify-between text-[10px] font-tabular pt-1 gap-3 ${currentPaper.pageMuted}`}
          >
            <span className="truncate">{document.copyrightHolder}</span>
            <span className="shrink-0">
              {userSession.canScreenshot
                ? `LICENSED: ${userSession.email}`
                : 'GLORIAMUS DRM · NO DOWNLOAD'}
            </span>
            <span className="font-semibold shrink-0">
              {pageNum} / {totalPages}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Build compact page jump list (up to 32 quick buttons; if larger, show input)
  const pageNumbersForGrid = Array.from({ length: Math.min(totalPages, 24) }, (_, i) => i + 1);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[#F5F5F7] dark:bg-[#0D0D0F] text-[#1D1D1F] dark:text-[#F5F5F7] select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Top Apple-Style Translucent Studio Bar */}
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4 bg-white/85 dark:bg-[#161618]/85 backdrop-blur-xl border-b border-black/8 dark:border-white/10 shrink-0 z-30">
        {/* Left Zone: Back to Library, TOC Toggle & Document Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              isTocOpen
                ? 'bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF]'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6]'
            }`}
            title="Tampilkan / Sembunyikan Daftar Isi Bagian"
          >
            {isTocOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1 hidden sm:block" />

          <div className="truncate hidden md:block">
            <div className="text-xs font-semibold truncate">{document.title}</div>
            <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] truncate">
              {document.creator} · <span className="font-tabular">{document.catalogNumber}</span>
              {isRealPdf && ' · PDF Asli (HiDPI Canvas)'}
            </div>
          </div>
        </div>

        {/* Center Zone: Interactive Reader Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Single vs Dual Page Spread Segmented Control */}
          <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-black/6 dark:bg-white/10">
            <button
              onClick={() => setSpreadMode('single')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                spreadMode === 'single'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1 Halaman</span>
            </button>
            <button
              onClick={() => setSpreadMode('dual')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                spreadMode === 'dual'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2 Halaman</span>
            </button>
          </div>

          {/* Precision Zoom Controls */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/6 dark:bg-white/10">
            <button
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              className="p-1 rounded hover:bg-black/8 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
              title="Perkecil (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-tabular text-xs font-medium px-1.5 min-w-[46px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(175, z + 15))}
              className="p-1 rounded hover:bg-black/8 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
              title="Perbesar (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 100 && (
              <button
                onClick={() => setZoom(100)}
                className="p-1 rounded hover:bg-black/8 dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6] transition-colors cursor-pointer"
                title="Reset Zoom 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Eye-Comfort Paper Tone Switcher */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-black/6 dark:bg-white/10">
            <button
              onClick={() => setPaperTone('ivory')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                paperTone === 'ivory'
                  ? 'bg-[#FAF7F0] text-[#1C1917] shadow-xs ring-1 ring-black/15'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6]'
              }`}
              title="Kertas Arsip Gading Hangat (Nyaman Dibaca Lama)"
            >
              Ivory
            </button>
            <button
              onClick={() => setPaperTone('alabaster')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                paperTone === 'alabaster'
                  ? 'bg-white text-[#111113] shadow-xs ring-1 ring-black/15'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6]'
              }`}
              title="Kertas Putih Galeri Kontras Tinggi"
            >
              Pure
            </button>
            <button
              onClick={() => setPaperTone('night')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                paperTone === 'night'
                  ? 'bg-[#1C1C1E] text-[#EAE6DF] shadow-xs ring-1 ring-white/20'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6]'
              }`}
              title="Mode Panggung Konser Redup"
            >
              Night
            </button>
          </div>
        </div>

        {/* Right Zone: Test Screenshot DRM Button, Auth Badge & Metadata Info */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleScreenshotAttempt('Uji Tombol Capture UI')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              userSession.canScreenshot
                ? 'bg-[#15803D]/12 text-[#15803D] dark:text-[#4ADE80] hover:bg-[#15803D]/20'
                : 'bg-[#B45309]/12 text-[#B45309] dark:text-[#FBBF24] hover:bg-[#B45309]/20'
            }`}
            title="Uji Simulasi Pengambilan Screenshot sesuai Hak Akses Login"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">
              {userSession.canScreenshot ? 'Ambil Cuplikan (Authorized)' : 'Uji Screenshot (Terkunci)'}
            </span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors whitespace-nowrap cursor-pointer"
            title="Lihat atau Ubah Status Login & Izin Hak Cipta"
          >
            {userSession.canScreenshot ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#8C6239] dark:text-[#D4A373]" />
            )}
            <span className="hidden sm:inline">{userSession.name.split(' ')[0]}</span>
          </button>

          <button
            onClick={() => onOpenInspector(document)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6] transition-colors cursor-pointer"
            title="Buka Detail Metadata Katalog"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Container: Collapsible TOC Sidebar + Protected Document Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible Movements / Table of Contents Sidebar */}
        {isTocOpen && (
          <aside className="w-72 sm:w-80 bg-white/90 dark:bg-[#161618]/90 backdrop-blur-xl border-r border-black/8 dark:border-white/10 flex flex-col justify-between shrink-0 z-20 overflow-y-auto">
            <div className="p-4 space-y-5">
              <div className="space-y-1">
                <div className="text-[10px] font-tabular uppercase tracking-widest text-[#8C6239] dark:text-[#D4A373]">
                  {document.accessionNumber} · {document.editionType}
                </div>
                <h3 className="font-editorial text-lg font-semibold leading-snug">
                  {document.title}
                </h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                  {document.creator} {document.creatorDates ? `(${document.creatorDates})` : ''}
                </p>
              </div>

              {/* Movements / Sections Navigation */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  {document.category === 'score'
                    ? 'Daftar Gerakan (Movements)'
                    : 'Daftar Bab (Chapters)'}
                </div>
                <div className="space-y-1">
                  {document.sections.map((sec) => {
                    const isCurrentSection = activeSectionId === sec.id;

                    return (
                      <button
                        key={sec.id}
                        onClick={() => goToPage(sec.startPage)}
                        className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                          isCurrentSection
                            ? 'bg-[#0066CC]/10 text-[#0066CC] dark:text-[#409CFF] font-medium'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1D1D1F] dark:text-[#E5E5EA]'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs truncate">
                            <span className="font-tabular mr-1.5 opacity-75">
                              {sec.indexLabel}
                            </span>
                            {sec.title}
                          </div>
                          <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] truncate">
                            {sec.tempoOrTopic}
                          </div>
                        </div>
                        <span className="font-tabular text-[11px] opacity-70 shrink-0">
                          Hlm. {sec.startPage}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Page Index Grid */}
              <div className="space-y-2 pt-2 border-t border-black/8 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                    Lompat Halaman
                  </span>
                  <span className="font-tabular text-[11px] text-[#6E6E73]">
                    Total {totalPages} hlm.
                  </span>
                </div>

                {totalPages > 24 && (
                  <div className="flex items-center gap-2 pb-1">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => goToPage(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-tabular focus:outline-none focus:ring-1 focus:ring-[#0066CC]"
                      aria-label="Masukkan nomor halaman"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5">
                  {pageNumbersForGrid.map((num) => {
                    const isVisible = visiblePageNumbers.includes(num);
                    return (
                      <button
                        key={num}
                        onClick={() => goToPage(num)}
                        className={`py-1.5 rounded-md font-tabular text-xs font-medium transition-colors cursor-pointer ${
                          isVisible
                            ? 'bg-[#0066CC] text-white'
                            : 'bg-black/5 dark:bg-white/8 hover:bg-black/10 dark:hover:bg-white/15 text-[#1D1D1F] dark:text-[#E5E5EA]'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom DRM Status Explanation Card inside TOC */}
            <div className="p-4 m-3 rounded-xl bg-[#F5F5F7] dark:bg-[#222225] border border-black/6 dark:border-white/8 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8C6239] dark:text-[#D4A373]" />
                  <span>Lisensi Sesi Baca</span>
                </span>
                <button
                  onClick={onOpenAuthModal}
                  className="text-[11px] text-[#0066CC] dark:text-[#409CFF] hover:underline font-medium cursor-pointer"
                >
                  Ubah Akun
                </button>
              </div>
              <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] space-y-1">
                <div>Unduh PDF: Tidak Diizinkan (Hak Cipta)</div>
                <div>
                  Screenshot:{' '}
                  <strong
                    className={
                      userSession.canScreenshot
                        ? 'text-[#15803D] dark:text-[#4ADE80]'
                        : 'text-[#B45309] dark:text-[#FBBF24]'
                    }
                  >
                    {userSession.canScreenshot
                      ? 'Diizinkan + Watermark'
                      : 'Diblokir (Perlu Izin)'}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center DRM-Protected Score & Book Viewport Stage */}
        <main
          className={`flex-1 ${currentPaper.stageBg} overflow-auto relative flex flex-col items-center justify-start p-4 sm:p-8 lg:p-10 transition-colors duration-200 drm-protected-stage`}
        >
          {/* Apple-Style macOS Security Toast HUD */}
          {hudToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] px-4 py-3.5 rounded-2xl bg-[#1D1D1F]/92 dark:bg-[#2C2C2E]/95 text-white backdrop-blur-2xl shadow-2xl border border-white/15 flex items-start gap-3">
              {hudToast.type === 'blocked' ? (
                <ShieldAlert className="w-5 h-5 text-[#F97066] shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <div className="font-semibold tracking-tight">{hudToast.title}</div>
                <p className="text-white/80 leading-relaxed">{hudToast.detail}</p>
              </div>
            </div>
          )}

          {/* Anti-Snipping Focus Blur Privacy Shield when window loses focus & user lacks permission */}
          {isWindowBlurred && !userSession.canScreenshot && (
            <div className="fixed inset-0 z-50 bg-[#141416]/85 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="max-w-md p-6 rounded-2xl bg-white/10 border border-white/15 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#F97066]/20 text-[#F97066] flex items-center justify-center mx-auto">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-2xl font-semibold">
                  Perisai Hak Cipta Aktif (Anti-Snipping Shield)
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Tampilan dokumen dikaburkan otomatis saat jendela kehilangan fokus untuk mencegah
                  pengambilan tangkapan layar eksternal. Klik kembali di dalam jendela ini untuk
                  melanjutkan membaca, atau gunakan akun yang telah diotorisasi oleh pustakawan
                  Gloriamus Library.
                </p>
                <button
                  onClick={() => setIsWindowBlurred(false)}
                  className="px-4 py-2 rounded-lg bg-white text-[#1D1D1F] text-xs font-semibold hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Lanjutkan Membaca
                </button>
              </div>
            </div>
          )}

          {/* Scaled Document Spread Container */}
          <div
            className="transition-transform duration-150 origin-top my-auto"
            style={{
              transform: `scale(${zoom / 100})`,
              width: spreadMode === 'dual' && visiblePageNumbers.length > 1 ? '100%' : 'auto',
              maxWidth: spreadMode === 'dual' && visiblePageNumbers.length > 1 ? '1340px' : '680px',
            }}
          >
            <div
              className={`grid gap-0 items-stretch justify-center ${
                spreadMode === 'dual' && visiblePageNumbers.length > 1
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {visiblePageNumbers.map((pgNum, idx) => renderPageSheet(pgNum, idx === 1))}
            </div>
          </div>

          {/* Floating Apple Books Style Bottom Page Navigation Pill */}
          <div className="sticky bottom-4 z-30 mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-white/88 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-lg">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-xs font-tabular font-medium px-2">
              {spreadMode === 'dual' && visiblePageNumbers.length > 1 ? (
                <span>
                  Halaman {visiblePageNumbers[0]}–{visiblePageNumbers[1]} dari {totalPages}
                </span>
              ) : (
                <span>
                  Halaman {currentPage} dari {totalPages}
                </span>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={
                spreadMode === 'dual'
                  ? currentPage + 1 >= totalPages && currentPage >= totalPages
                  : currentPage >= totalPages
              }
              className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Berikutnya (Panah Kanan)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
