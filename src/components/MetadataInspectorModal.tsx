import React from 'react';
import {
  X,
  BookOpen,
  ShieldAlert,
  Lock,
  CheckCircle2,
  ListMusic,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { LibraryDocument, UserSession } from '../types/library';

interface MetadataInspectorModalProps {
  document: LibraryDocument | null;
  userSession: UserSession;
  onClose: () => void;
  onOpenReader: (doc: LibraryDocument, initialPage?: number) => void;
  onOpenAuthModal: () => void;
}

export const MetadataInspectorModal: React.FC<MetadataInspectorModalProps> = ({
  document,
  userSession,
  onClose,
  onOpenReader,
  onOpenAuthModal,
}) => {
  if (!document) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <aside
        className="relative w-full max-w-2xl h-full bg-[#FBFBFD] dark:bg-[#141416] text-[#1D1D1F] dark:text-[#F5F5F7] border-l border-black/10 dark:border-white/10 shadow-2xl overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Translucent Apple-Style Top Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#FBFBFD]/85 dark:bg-[#141416]/85 backdrop-blur-xl border-b border-black/8 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] font-tabular">
            <span>ACCESSION INSPECTOR</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
              {document.accessionNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6] transition-colors"
            aria-label="Tutup Panel Metadata"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Header Block with Cover & Primary Identity */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-32 sm:w-36 aspect-[3/4] rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-md shrink-0 bg-[#EBE6DF] dark:bg-[#232326]">
              <img
                src={document.coverImage}
                alt={document.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 flex-1">
              {/* Zero-Pill Metadata Kicker */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#8C6239] dark:text-[#D4A373] font-medium">
                <span>{document.category === 'score' ? 'Partitur Musik (Musical Score)' : 'Monograf & Referensi Musikologi'}</span>
                <span aria-hidden="true">·</span>
                <span>{document.eraOrField}</span>
                <span aria-hidden="true">·</span>
                <span className="font-tabular">{document.catalogNumber}</span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-[#1D1D1F] dark:text-[#F5F5F7]">
                {document.title}
              </h2>

              <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                {document.subtitle}
              </p>

              <div className="pt-1 text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                {document.creator}{' '}
                <span className="text-[#6E6E73] dark:text-[#A1A1A6] font-normal font-tabular">
                  ({document.creatorDates})
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Banner */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/6 dark:border-white/8">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#409CFF]" />
                <span>Studio Reader Interaktif ({document.pageCount} Halaman Resolusi Tinggi)</span>
              </div>
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Mendukung tampilan 1 atau 2 halaman, zoom presisi, dan penyesuaian warna kertas.
              </p>
            </div>
            <button
              onClick={() => onOpenReader(document, 1)}
              className="px-5 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buka di Studio Reader
            </button>
          </div>

          {/* Synopsis & Editorial Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6]">
              Catatan Kuratorial & Filologi
            </h3>
            <p className="text-sm leading-relaxed text-[#1D1D1F] dark:text-[#E5E5EA]">
              {document.synopsis}
            </p>
            <div className="p-4 rounded-lg bg-[#FAF7F0] dark:bg-[#1D1C1A] border border-[#E5DEC9] dark:border-[#33302A] text-xs leading-relaxed text-[#5C5346] dark:text-[#C7BFA8]">
              <strong className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Aparatus Kritis Edisi:
              </strong>{' '}
              {document.editorialNotes}
            </div>
          </div>

          {/* Museum Accession Definition List (dl) with Hairline Dividers */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6]">
              Spesifikasi Metadata Katalog
            </h3>
            <dl className="divide-y divide-black/8 dark:divide-white/10 border-t border-b border-black/8 dark:border-white/10 text-xs">
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Nomor Aksesi Arsip</dt>
                <dd className="col-span-2 font-tabular font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.accessionNumber} · {document.catalogNumber}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Instrumen / Format</dt>
                <dd className="col-span-2 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.instrumentation}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Tonika / Bidang</dt>
                <dd className="col-span-2 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.keySignature}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Struktur Tempo / Bab</dt>
                <dd className="col-span-2 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.tempoMarking}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Edisi & Penerbit</dt>
                <dd className="col-span-2 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.editionType} — {document.publisher} ({document.publicationYear})
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#6E6E73] dark:text-[#A1A1A6]">Pemegang Hak Cipta</dt>
                <dd className="col-span-2 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {document.copyrightHolder}
                </dd>
              </div>
            </dl>
          </div>

          {/* Interactive Movements / Chapters Direct Jump List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1.5">
                {document.category === 'score' ? (
                  <ListMusic className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Daftar Bagian & Lompat Halaman</span>
              </h3>
              <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] font-tabular">
                {document.sections.length} Bagian Terindeks
              </span>
            </div>

            <div className="divide-y divide-black/8 dark:divide-white/10 border border-black/8 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
              {document.sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => onOpenReader(document, sec.startPage)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[#F5F5F7] dark:hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#0066CC] dark:group-hover:text-[#409CFF] transition-colors">
                      <span className="font-tabular mr-2 text-[#8C6239] dark:text-[#D4A373]">
                        {sec.indexLabel}
                      </span>
                      {sec.title}
                    </div>
                    {sec.subtitle && (
                      <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                        {sec.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-tabular text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                      Hlm. {sec.startPage}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#6E6E73] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Copyright & DRM Enforcement Status Box */}
          <div className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-[#F5F5F7]/70 dark:bg-[#1C1C1E]/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#8C6239] dark:text-[#D4A373]" />
                <span>Status Perlindungan Hak Cipta & DRM</span>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="text-xs font-medium text-[#0066CC] dark:text-[#409CFF] hover:underline cursor-pointer"
              >
                Ubah Hak Akses Sesi
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              {document.copyrightNotice}
            </p>

            <div className="pt-2 border-t border-black/8 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-[#B42318] dark:text-[#F97066]">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Unduh Langsung & Cetak PDF: Diblokir Permanen</span>
              </div>
              {userSession.canScreenshot ? (
                <div className="flex items-center gap-2 text-[#15803D] dark:text-[#4ADE80]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Screenshot: Diizinkan (Dengan Watermark ID)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#B45309] dark:text-[#FBBF24]">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Screenshot: Diblokir (Butuh Otorisasi Login)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
