import React, { useState, useRef } from 'react';
import {
  LayoutGrid,
  Upload,
  Users,
  ShieldAlert,
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  FileUp,
  CheckCircle2,
  Lock,
  Camera,
  ShieldCheck,
  ListMusic,
  X,
  Image as ImageIcon,
  UserPlus,
  Database,
  Eye,
} from 'lucide-react';
import {
  LibraryDocument,
  DocumentCategory,
  EraOrField,
  DocumentSection,
  UserSession,
  UserRole,
  SecurityEventLog,
} from '../types/library';
import { CURATED_COVER_OPTIONS, POSTGRES_SCHEMA_PREVIEW } from '../data/libraryCatalog';
import { inspectUploadedPdf } from '../lib/pdfEngine';

type AdminTab = 'catalog' | 'editor' | 'users' | 'audit';

interface LibrarianAdminWorkspaceProps {
  documents: LibraryDocument[];
  users: UserSession[];
  activeUser: UserSession;
  securityLogs: SecurityEventLog[];
  onBackToLibrary: () => void;
  onOpenReader: (doc: LibraryDocument, initialPage?: number) => void;
  onCreateDocument: (doc: LibraryDocument) => void;
  onUpdateDocument: (doc: LibraryDocument) => void;
  onToggleArchiveDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleUserScreenshot: (userId: string) => void;
  onChangeUserRole: (userId: string, role: UserRole) => void;
  onAddUser: (user: UserSession) => void;
  onSwitchActiveUser: (userId: string) => void;
  onClearSecurityLogs: () => void;
}

const ERA_OPTIONS: EraOrField[] = [
  'Baroque',
  'Classical',
  'Romantic',
  'Impressionist',
  'Contemporary',
  'Musicology & Acoustics',
];

function createEmptyFormState(nextIndex: number) {
  return {
    id: '',
    accessionNumber: `GLR-2026-${String(nextIndex).padStart(3, '0')}`,
    title: '',
    subtitle: '',
    creator: '',
    creatorDates: '',
    catalogNumber: '',
    category: 'score' as DocumentCategory,
    eraOrField: 'Classical' as EraOrField,
    instrumentation: 'Piano Solo',
    keySignature: 'C Major',
    tempoMarking: 'Allegro — Adagio — Finale',
    editionType: 'Urtext Critical Edition',
    publisher: 'Gloriamus Archival Press',
    publicationYear: new Date().getFullYear(),
    pageCount: 1,
    copyrightHolder: '© 2026 Gloriamus Library Archival Edition',
    copyrightNotice:
      'Dokumen ini dilindungi hak cipta penulis dan penerbit. Pengunduhan langsung dan pencetakan dinonaktifkan.',
    coverImage: CURATED_COVER_OPTIONS[0].url,
    synopsis: '',
    editorialNotes: '',
    sourceType: 'uploaded_pdf' as LibraryDocument['sourceType'],
    pdfDataUrl: '' as string,
    pdfFileName: '' as string,
    pdfFileSizeLabel: '' as string,
    sections: [
      {
        id: `sec-new-${Date.now()}`,
        indexLabel: 'I.',
        title: 'Halaman Pembuka',
        tempoOrTopic: 'Bagian Utama',
        startPage: 1,
      },
    ] as DocumentSection[],
  };
}

export const LibrarianAdminWorkspace: React.FC<LibrarianAdminWorkspaceProps> = ({
  documents,
  users,
  activeUser,
  securityLogs,
  onBackToLibrary,
  onOpenReader,
  onCreateDocument,
  onUpdateDocument,
  onToggleArchiveDocument,
  onDeleteDocument,
  onToggleUserScreenshot,
  onChangeUserRole,
  onAddUser,
  onSwitchActiveUser,
  onClearSecurityLogs,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');

  // Catalog Manager Filter State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<
    'all' | 'published' | 'archived' | 'uploaded_pdf'
  >('all');
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<LibraryDocument | null>(null);

  // Document Editor / PDF Upload State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [form, setForm] = useState(() => createEmptyFormState(documents.length + 1));
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState('');
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [savedSuccessDoc, setSavedSuccessDoc] = useState<LibraryDocument | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // New User Form State
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserInstitution, setNewUserInstitution] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [newUserCanScreenshot, setNewUserCanScreenshot] = useState(false);

  // Audit Log Filter & SQL Preview State
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);

  // Open Editor for New Upload
  const startNewDocument = () => {
    setEditingDocId(null);
    setForm(createEmptyFormState(documents.length + 1));
    setPdfUploadError('');
    setSavedSuccessDoc(null);
    setActiveTab('editor');
  };

  // Open Editor for Existing Document
  const startEditDocument = (doc: LibraryDocument) => {
    setEditingDocId(doc.id);
    setForm({
      id: doc.id,
      accessionNumber: doc.accessionNumber,
      title: doc.title,
      subtitle: doc.subtitle,
      creator: doc.creator,
      creatorDates: doc.creatorDates,
      catalogNumber: doc.catalogNumber,
      category: doc.category,
      eraOrField: doc.eraOrField,
      instrumentation: doc.instrumentation,
      keySignature: doc.keySignature,
      tempoMarking: doc.tempoMarking,
      editionType: doc.editionType,
      publisher: doc.publisher,
      publicationYear: doc.publicationYear,
      pageCount: doc.pageCount,
      copyrightHolder: doc.copyrightHolder,
      copyrightNotice: doc.copyrightNotice,
      coverImage: doc.coverImage,
      synopsis: doc.synopsis,
      editorialNotes: doc.editorialNotes,
      sourceType: doc.sourceType,
      pdfDataUrl: doc.pdfDataUrl || '',
      pdfFileName: doc.pdfFileName || '',
      pdfFileSizeLabel: doc.pdfFileSizeLabel || '',
      sections: doc.sections.map((s) => ({ ...s })),
    });
    setPdfUploadError('');
    setSavedSuccessDoc(null);
    setActiveTab('editor');
  };

  // Handle Real PDF File Upload & Inspection via PDF.js
  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfUploadError('Mohon unggah file berformat PDF (.pdf) yang valid.');
      return;
    }

    setIsParsingPdf(true);
    setPdfUploadError('');
    try {
      const parsed = await inspectUploadedPdf(file);
      const cleanBaseName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();

      setForm((prev) => ({
        ...prev,
        sourceType: 'uploaded_pdf',
        pdfDataUrl: parsed.pdfDataUrl,
        pdfFileName: parsed.fileName,
        pdfFileSizeLabel: parsed.fileSizeLabel,
        pageCount: parsed.pageCount,
        coverImage: parsed.coverDataUrl,
        title: prev.title.trim() ? prev.title : cleanBaseName,
        sections: parsed.extractedSections,
      }));
    } catch (err) {
      console.error('Failed to parse uploaded PDF:', err);
      setPdfUploadError(
        'Gagal membaca struktur PDF ini. Pastikan file PDF tidak terenkripsi password.'
      );
    } finally {
      setIsParsingPdf(false);
    }
  };

  // Handle Custom Cover Image Upload
  const handleCoverImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, coverImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // TOC Builder Handlers
  const addSectionRow = () => {
    setForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          indexLabel:
            prev.category === 'score'
              ? `${prev.sections.length + 1}.`
              : `Bab ${String(prev.sections.length + 1).padStart(2, '0')}`,
          title: '',
          tempoOrTopic: '',
          startPage: Math.min(prev.pageCount, prev.sections.length + 1),
        },
      ],
    }));
  };

  const updateSectionRow = (
    idx: number,
    field: keyof DocumentSection,
    value: string | number
  ) => {
    setForm((prev) => {
      const next = [...prev.sections];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, sections: next };
    });
  };

  const removeSectionRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };

  // Submit New or Edited Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.creator.trim()) {
      setPdfUploadError('Judul dokumen dan Nama Komponis / Penulis wajib diisi.');
      return;
    }

    if (!editingDocId && !form.pdfDataUrl) {
      setPdfUploadError(
        'Silakan unggah file PDF (.pdf) terlebih dahulu agar dokumen dapat dibaca langsung di Studio Reader.'
      );
      return;
    }

    const existingDoc = editingDocId
      ? documents.find((d) => d.id === editingDocId)
      : undefined;

    const cleanSections =
      form.sections.length > 0
        ? form.sections.map((s, i) => ({
            ...s,
            indexLabel: s.indexLabel.trim() || `${i + 1}.`,
            title: s.title.trim() || `Bagian ${i + 1}`,
            tempoOrTopic: s.tempoOrTopic.trim() || `Halaman ${s.startPage}`,
            startPage: Math.max(1, Math.min(form.pageCount, Number(s.startPage) || 1)),
          }))
        : [
            {
              id: `sec-default-${Date.now()}`,
              indexLabel: 'I.',
              title: 'Isi Utama Dokumen',
              tempoOrTopic: `1–${form.pageCount} Halaman`,
              startPage: 1,
            },
          ];

    const finalDoc: LibraryDocument = {
      id: existingDoc ? existingDoc.id : `doc-pdf-${Date.now()}`,
      accessionNumber:
        form.accessionNumber.trim() || `GLR-2026-${String(documents.length + 1).padStart(3, '0')}`,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || 'Edisi Digital Arsip Gloriamus Library',
      creator: form.creator.trim(),
      creatorDates: form.creatorDates.trim(),
      catalogNumber: form.catalogNumber.trim() || 'GLR-MS',
      category: form.category,
      status: existingDoc ? existingDoc.status : 'published',
      sourceType: form.pdfDataUrl ? 'uploaded_pdf' : existingDoc?.sourceType || 'curated_sample',
      pdfDataUrl: form.pdfDataUrl || existingDoc?.pdfDataUrl,
      pdfFileName: form.pdfFileName || existingDoc?.pdfFileName,
      pdfFileSizeLabel: form.pdfFileSizeLabel || existingDoc?.pdfFileSizeLabel,
      eraOrField: form.eraOrField,
      instrumentation: form.instrumentation.trim() || 'Solo / Reference',
      keySignature: form.keySignature.trim() || '—',
      tempoMarking: form.tempoMarking.trim() || `${cleanSections.length} Bagian Terindeks`,
      durationOrExtent: `${form.pageCount} Halaman Digital${
        form.pdfFileSizeLabel ? ` · ${form.pdfFileSizeLabel}` : ''
      }`,
      editionType: form.editionType.trim() || 'Archival Digital Edition',
      publisher: form.publisher.trim() || 'Gloriamus Library Archive',
      publicationYear: Number(form.publicationYear) || new Date().getFullYear(),
      pageCount: Math.max(1, Number(form.pageCount) || 1),
      copyrightHolder: form.copyrightHolder.trim() || '© Gloriamus Library & Pemilik Hak Cipta',
      copyrightNotice:
        form.copyrightNotice.trim() ||
        'Dilindungi hak cipta penulis. Unduh langsung dan tangkapan layar tanpa otorisasi diblokir.',
      coverImage: form.coverImage || CURATED_COVER_OPTIONS[0].url,
      synopsis:
        form.synopsis.trim() ||
        'Koleksi digital terproteksi yang diarsipkan oleh pustakawan Gloriamus Library.',
      editorialNotes:
        form.editorialNotes.trim() ||
        'Diunggah langsung ke repositori Gloriamus Studio Reader dengan perlindungan DRM aktif.',
      sections: cleanSections,
      pages: existingDoc ? existingDoc.pages : [],
    };

    if (existingDoc) {
      onUpdateDocument(finalDoc);
    } else {
      onCreateDocument(finalDoc);
    }

    setSavedSuccessDoc(finalDoc);
    setPdfUploadError('');
  };

  // Submit New Reader Account
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const created: UserSession = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      institution: newUserInstitution.trim() || 'Gloriamus Registered Reader',
      role: newUserRole,
      isLoggedIn: true,
      canScreenshot: newUserRole === 'librarian' ? true : newUserCanScreenshot,
      canDownload: false,
      licenseToken:
        newUserRole === 'librarian'
          ? `GLR-LIBRARIAN-${randomCode}`
          : newUserCanScreenshot
          ? `GLR-AUTH-CAPTURE-${randomCode}`
          : `GLR-STD-READ-${randomCode}`,
    };

    onAddUser(created);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserInstitution('');
    setNewUserRole('member');
    setNewUserCanScreenshot(false);
    setShowAddUserForm(false);
  };

  // Filtered Catalog Rows
  const filteredCatalog = documents.filter((doc) => {
    if (catalogStatusFilter === 'published' && doc.status !== 'published') return false;
    if (catalogStatusFilter === 'archived' && doc.status !== 'archived') return false;
    if (catalogStatusFilter === 'uploaded_pdf' && doc.sourceType !== 'uploaded_pdf') return false;

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.creator.toLowerCase().includes(q) ||
        doc.accessionNumber.toLowerCase().includes(q) ||
        doc.catalogNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Audit Logs
  const filteredLogs = securityLogs.filter((log) => {
    if (auditFilter === 'ALL') return true;
    return log.actionType === auditFilter;
  });

  // Catalog Stats
  const publishedCount = documents.filter((d) => d.status === 'published').length;
  const archivedCount = documents.filter((d) => d.status === 'archived').length;
  const uploadedPdfCount = documents.filter((d) => d.sourceType === 'uploaded_pdf').length;

  // Audit Stats
  const blockedScreenshotCount = securityLogs.filter(
    (l) => l.actionType === 'SHORTCUT_CAPTURE_BLOCKED' || l.actionType === 'FOCUS_BLUR_SHIELD'
  ).length;
  const blockedDownloadPrintCount = securityLogs.filter(
    (l) => l.actionType === 'PRINT_EXPORT_BLOCKED' || l.actionType === 'RIGHT_CLICK_BLOCKED'
  ).length;
  const authorizedCaptureCount = securityLogs.filter(
    (l) => l.actionType === 'AUTHORIZED_CAPTURE_WATERMARKED'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#0D0D0F] text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* Top macOS Studio Header */}
      <header className="sticky top-0 z-30 h-14 px-5 lg:px-8 flex items-center justify-between gap-6 bg-white/85 dark:bg-[#161618]/85 backdrop-blur-xl border-b border-black/8 dark:border-white/10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Katalog Publik</span>
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs truncate">
            <span className="font-editorial text-lg font-bold tracking-tight whitespace-nowrap">
              Gloriamus Library
            </span>
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]" aria-hidden="true">
              /
            </span>
            <span className="text-[#6E6E73] dark:text-[#A1A1A6] font-medium truncate">
              Librarian Admin Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={startNewDocument}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Unggah PDF Baru</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace: Left macOS Sidebar + Right Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white/75 dark:bg-[#141416]/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-black/8 dark:border-white/10 p-4 flex flex-col justify-between gap-6">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF] font-semibold'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/6 hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4" />
                <span>Koleksi & Katalog</span>
              </span>
              <span className="font-tabular text-[11px] opacity-75">{documents.length}</span>
            </button>

            <button
              onClick={() => {
                setSavedSuccessDoc(null);
                setActiveTab('editor');
              }}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF] font-semibold'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/6 hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Upload className="w-4 h-4" />
                <span>{editingDocId ? 'Edit Koleksi' : 'Unggah PDF & Editor'}</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF] font-semibold'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/6 hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Izin Pengguna & Capture</span>
              </span>
              <span className="font-tabular text-[11px] opacity-75">{users.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF] font-semibold'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/6 hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Audit Keamanan DRM</span>
              </span>
              <span className="font-tabular text-[11px] opacity-75">{securityLogs.length}</span>
            </button>
          </nav>

          {/* Active Librarian Profile Summary */}
          <div className="hidden lg:block p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/6 dark:border-white/8 space-y-1.5 text-xs">
            <div className="text-[10px] font-tabular uppercase tracking-widest text-[#8C6239] dark:text-[#D4A373]">
              SESI AKTIF SAAT INI
            </div>
            <div className="font-semibold truncate">{activeUser.name}</div>
            <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] truncate">
              {activeUser.email}
            </div>
            <div className="pt-1.5 border-t border-black/6 dark:border-white/8 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
              Screenshot:{' '}
              <strong
                className={
                  activeUser.canScreenshot
                    ? 'text-[#15803D] dark:text-[#4ADE80]'
                    : 'text-[#B45309] dark:text-[#FBBF24]'
                }
              >
                {activeUser.canScreenshot ? 'Diizinkan' : 'Diblokir'}
              </strong>
            </div>
          </div>
        </aside>

        {/* Main Right Admin Content Viewport */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 overflow-y-auto space-y-8">
          {/* ============================================================== */}
          {/* TAB 1: KOLEKSI & KATALOG MANAGER                               */}
          {/* ============================================================== */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-editorial text-3xl font-semibold tracking-tight">
                    Manajemen Koleksi & Katalog Arsip
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    Kelola seluruh partitur musik dan buku referensi Gloriamus Library. Dokumen yang
                    diarsipkan otomatis disembunyikan dari katalog pembaca publik.
                  </p>
                </div>
                <button
                  onClick={startNewDocument}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Unggah PDF & Tambah Koleksi</span>
                </button>
              </div>

              {/* Clean 4-Column Metric Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Total Koleksi</div>
                  <div className="font-tabular text-2xl font-semibold">{documents.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Aktif di Katalog</div>
                  <div className="font-tabular text-2xl font-semibold text-[#15803D] dark:text-[#4ADE80]">
                    {publishedCount}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Diarsipkan</div>
                  <div className="font-tabular text-2xl font-semibold text-[#B45309] dark:text-[#FBBF24]">
                    {archivedCount}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    PDF Unggahan Asli
                  </div>
                  <div className="font-tabular text-2xl font-semibold text-[#0066CC] dark:text-[#409CFF]">
                    {uploadedPdfCount}
                  </div>
                </div>
              </div>

              {/* Search & Status Filter Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/8 overflow-x-auto">
                  {(
                    [
                      ['all', 'Semua'],
                      ['published', 'Dipublikasikan'],
                      ['archived', 'Diarsipkan'],
                      ['uploaded_pdf', 'PDF Unggahan'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCatalogStatusFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        catalogStatusFilter === key
                          ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                          : 'text-[#6E6E73] dark:text-[#A1A1A6]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari judul, komponis, nomor aksesi..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#161618] border border-black/10 dark:border-white/12 text-xs focus:outline-none focus:border-[#0066CC]"
                  />
                </div>
              </div>

              {/* Catalog Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#161618]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/8 dark:border-white/10 bg-[#F5F5F7]/70 dark:bg-[#1C1C1E]/70 text-[#6E6E73] dark:text-[#A1A1A6]">
                      <th className="py-3 px-4 font-semibold">Dokumen & Komponis</th>
                      <th className="py-3 px-4 font-semibold">Aksesi / Katalog</th>
                      <th className="py-3 px-4 font-semibold">Sumber & Halaman</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Tindakan Pustakawan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 px-4 text-center text-[#6E6E73] dark:text-[#A1A1A6]"
                        >
                          Tidak ada koleksi yang sesuai dengan filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-[#F5F5F7]/60 dark:hover:bg-white/4 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={doc.coverImage}
                                alt={doc.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-12 rounded object-cover border border-black/10 dark:border-white/10 shrink-0 bg-[#EFECE6]"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[260px]">
                                  {doc.title}
                                </div>
                                <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] truncate max-w-[260px]">
                                  {doc.creator} ·{' '}
                                  {doc.category === 'score' ? 'Partitur' : 'Buku Referensi'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-tabular whitespace-nowrap">
                            <div className="font-medium">{doc.accessionNumber}</div>
                            <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                              {doc.catalogNumber}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium">
                              {doc.sourceType === 'uploaded_pdf'
                                ? 'File PDF Asli'
                                : 'Edisi Sampel Vektor'}
                            </div>
                            <div className="font-tabular text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                              {doc.pageCount} hlm. · {doc.sections.length} bagian TOC
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {doc.status === 'published' ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#15803D] dark:text-[#4ADE80]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Publikasi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#B45309] dark:text-[#FBBF24]">
                                <Archive className="w-3.5 h-3.5" />
                                <span>Diarsipkan</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => onOpenReader(doc, 1)}
                                className="p-2 rounded-lg hover:bg-[#0066CC]/12 text-[#0066CC] dark:text-[#409CFF] transition-colors cursor-pointer"
                                title="Pratinjau di Studio Reader"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEditDocument(doc)}
                                className="p-2 rounded-lg hover:bg-black/6 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#E5E5EA] transition-colors cursor-pointer"
                                title="Edit Metadata & Daftar Gerakan/Bab"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onToggleArchiveDocument(doc.id)}
                                className="p-2 rounded-lg hover:bg-black/6 dark:hover:bg-white/10 text-[#B45309] dark:text-[#FBBF24] transition-colors cursor-pointer"
                                title={
                                  doc.status === 'published'
                                    ? 'Arsipkan (Sembunyikan dari Katalog Publik)'
                                    : 'Pulihkan ke Katalog Publik'
                                }
                              >
                                {doc.status === 'published' ? (
                                  <Archive className="w-3.5 h-3.5" />
                                ) : (
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteDoc(doc)}
                                className="p-2 rounded-lg hover:bg-[#B42318]/12 text-[#B42318] dark:text-[#F97066] transition-colors cursor-pointer"
                                title="Hapus Koleksi Permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: UNGGAH PDF ASLI, METADATA EDITOR & TOC BUILDER          */}
          {/* ============================================================== */}
          {activeTab === 'editor' && (
            <form onSubmit={handleSaveDocument} className="space-y-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-editorial text-3xl font-semibold tracking-tight">
                    {editingDocId
                      ? 'Edit Metadata & Daftar Isi Koleksi'
                      : 'Unggah PDF Baru ke Gloriamus Library'}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    Tarik file PDF partitur atau buku musik dari komputer Anda. Sistem akan otomatis
                    membaca jumlah halaman, membuat sampul dari halaman 1, dan merendernya secara
                    interaktif di Studio Reader.
                  </p>
                </div>
                {editingDocId && (
                  <button
                    type="button"
                    onClick={startNewDocument}
                    className="text-xs font-medium text-[#0066CC] dark:text-[#409CFF] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    + Buat Unggahan Baru
                  </button>
                )}
              </div>

              {/* Saved Success Callout */}
              {savedSuccessDoc && (
                <div className="p-4 rounded-2xl bg-[#15803D]/10 border border-[#15803D]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-semibold text-[#1D1D1F] dark:text-white">
                        “{savedSuccessDoc.title}” berhasil disimpan ke Gloriamus Library!
                      </div>
                      <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                        {savedSuccessDoc.pageCount} halaman siap dibaca dengan mode 1/2 halaman,
                        kertas Ivory/Night, dan proteksi DRM penuh.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenReader(savedSuccessDoc, 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Buka di Studio Reader</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-[#242428] border border-black/10 dark:border-white/10 text-xs font-medium cursor-pointer"
                    >
                      Lihat Katalog
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Real PDF Drag-and-Drop Zone */}
              <section className="p-6 rounded-2xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6]">
                    01. Berkas PDF Partitur / Buku Asli
                  </h2>
                  {form.pdfFileName && (
                    <span className="font-tabular text-xs text-[#15803D] dark:text-[#4ADE80] font-medium">
                      Terpasang · {form.pageCount} Halaman ({form.pdfFileSizeLabel})
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(true);
                  }}
                  onDragLeave={() => setIsDraggingPdf(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPdf(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handlePdfFile(file);
                  }}
                  onClick={() => pdfInputRef.current?.click()}
                  className={`p-7 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
                    isDraggingPdf
                      ? 'border-[#0066CC] bg-[#0066CC]/8'
                      : 'border-black/15 dark:border-white/15 hover:border-[#0066CC]/60 bg-[#FBFBFD] dark:bg-[#121214]'
                  }`}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfFile(file);
                    }}
                  />

                  {isParsingPdf ? (
                    <div className="py-4 flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-[#0066CC]/30 border-t-[#0066CC] animate-spin" />
                      <div className="text-xs font-medium">
                        Membaca struktur PDF, mengekstrak jumlah halaman & sampul halaman 1...
                      </div>
                    </div>
                  ) : form.pdfFileName ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 text-left">
                      <img
                        src={form.coverImage}
                        alt="Pratinjau Halaman 1 PDF"
                        className="w-20 h-28 object-cover rounded-md border border-black/15 shadow-sm bg-[#FAF7F0] shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                          {form.pdfFileName}
                        </div>
                        <div className="text-xs font-tabular text-[#6E6E73] dark:text-[#A1A1A6]">
                          {form.pageCount} Halaman Terdeteksi · {form.pdfFileSizeLabel} · HiDPI
                          Canvas Ready
                        </div>
                        <div className="text-xs text-[#0066CC] dark:text-[#409CFF] font-medium pt-1">
                          Klik atau tarik file PDF lain untuk mengganti berkas
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <FileUp className="w-7 h-7 mx-auto text-[#0066CC] dark:text-[#409CFF]" />
                      <div className="text-sm font-semibold">
                        Tarik & Lepas file .PDF di sini, atau klik untuk memilih dari komputer
                      </div>
                      <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-md mx-auto">
                        PDF akan dirender secara aman ke kanvas Studio Reader tanpa tombol unduh
                        bawaan browser, lengkap dengan kertas Ivory, Night Mode, dan Watermark ID.
                      </p>
                    </div>
                  )}
                </div>

                {pdfUploadError && (
                  <div className="p-3 rounded-lg bg-[#B42318]/10 text-[#B42318] dark:text-[#F97066] text-xs font-medium">
                    {pdfUploadError}
                  </div>
                )}

                {/* Cover Thumbnail Customization */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Sampul Katalog:</span>
                    {CURATED_COVER_OPTIONS.map((opt) => (
                      <button
                        key={opt.url}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, coverImage: opt.url }))}
                        className={`px-2 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
                          form.coverImage === opt.url
                            ? 'border-[#0066CC] bg-[#0066CC]/10 text-[#0066CC] font-medium'
                            : 'border-black/10 dark:border-white/10 hover:bg-black/5'
                        }`}
                      >
                        {opt.label.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                  <div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverImageUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="text-xs font-medium text-[#0066CC] dark:text-[#409CFF] hover:underline cursor-pointer"
                    >
                      Unggah Sampul Kustom (.jpg/.png)
                    </button>
                  </div>
                </div>
              </section>

              {/* Step 2: Comprehensive Musicology Metadata Form */}
              <section className="p-6 rounded-2xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6]">
                  02. Metadata Katalog Musikologi & Hak Cipta
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Judul Karya / Buku <span className="text-[#B42318]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Contoh: Nocturnes Op. 27 (Urtext) atau Harmoni Modal Abad XVI"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Subjudul / Keterangan Edisi
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="Contoh: Edisi Kritis Berdasarkan Manuskrip Autograf"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Komponis / Penulis <span className="text-[#B42318]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.creator}
                      onChange={(e) => setForm({ ...form, creator: e.target.value })}
                      placeholder="Contoh: Frédéric Chopin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Rentang Tahun Komponis / Penulis
                    </label>
                    <input
                      type="text"
                      value={form.creatorDates}
                      onChange={(e) => setForm({ ...form, creatorDates: e.target.value })}
                      placeholder="Contoh: 1810–1849"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 font-tabular focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Kategori Koleksi
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value as DocumentCategory })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    >
                      <option value="score">Partitur Musik (Musical Score)</option>
                      <option value="book">Buku Referensi Musikologi (Monograph)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Era Musik / Bidang Keilmuan
                    </label>
                    <select
                      value={form.eraOrField}
                      onChange={(e) =>
                        setForm({ ...form, eraOrField: e.target.value as EraOrField })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    >
                      {ERA_OPTIONS.map((era) => (
                        <option key={era} value={era}>
                          {era}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Nomor Katalog / Opus / ISBN
                    </label>
                    <input
                      type="text"
                      value={form.catalogNumber}
                      onChange={(e) => setForm({ ...form, catalogNumber: e.target.value })}
                      placeholder="Contoh: Op. 27 No. 2 / BWV 846 / ISBN..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 font-tabular focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Nomor Aksesi Arsip Gloriamus
                    </label>
                    <input
                      type="text"
                      value={form.accessionNumber}
                      onChange={(e) => setForm({ ...form, accessionNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 font-tabular focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Instrumen / Format
                    </label>
                    <input
                      type="text"
                      value={form.instrumentation}
                      onChange={(e) => setForm({ ...form, instrumentation: e.target.value })}
                      placeholder="Contoh: Piano Solo / String Quartet / Monograf"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Tonika / Kunci Nada
                    </label>
                    <input
                      type="text"
                      value={form.keySignature}
                      onChange={(e) => setForm({ ...form, keySignature: e.target.value })}
                      placeholder="Contoh: D-flat Major / C Minor"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Jenis Edisi
                    </label>
                    <input
                      type="text"
                      value={form.editionType}
                      onChange={(e) => setForm({ ...form, editionType: e.target.value })}
                      placeholder="Contoh: Urtext Critical Edition"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Penerbit & Tahun Terbit
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.publisher}
                        onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                        placeholder="Nama Penerbit"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                      />
                      <input
                        type="number"
                        value={form.publicationYear}
                        onChange={(e) =>
                          setForm({ ...form, publicationYear: Number(e.target.value) })
                        }
                        className="w-24 px-3 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 font-tabular focus:outline-none focus:border-[#0066CC]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Pemegang Hak Cipta (Ditampilkan pada Kaki Halaman & DRM)
                    </label>
                    <input
                      type="text"
                      value={form.copyrightHolder}
                      onChange={(e) => setForm({ ...form, copyrightHolder: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                      Sinopsis & Catatan Kuratorial
                    </label>
                    <textarea
                      rows={3}
                      value={form.synopsis}
                      onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                      placeholder="Ringkasan latar belakang karya, keistimewaan edisi, atau cakupan bab buku..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>
                </div>
              </section>

              {/* Step 3: Dynamic Movements / Chapters TOC Builder */}
              <section className="p-6 rounded-2xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1.5">
                      <ListMusic className="w-3.5 h-3.5" />
                      <span>03. Penyusun Daftar Gerakan / Bab (Table of Contents)</span>
                    </h2>
                    <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                      Petakan gerakan partitur atau bab buku ke nomor halaman PDF (1–{form.pageCount})
                      untuk navigasi cepat di Studio Reader.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSectionRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5F7] dark:bg-[#242428] hover:bg-black/8 dark:hover:bg-white/12 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bagian</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-[#F5F5F7]/70 dark:bg-[#1C1C1E] border border-black/6 dark:border-white/8 text-xs"
                    >
                      <input
                        type="text"
                        value={sec.indexLabel}
                        onChange={(e) => updateSectionRow(idx, 'indexLabel', e.target.value)}
                        placeholder="I."
                        className="col-span-2 sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141416] border border-black/10 dark:border-white/10 font-tabular"
                        aria-label="Label indeks bagian"
                      />
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateSectionRow(idx, 'title', e.target.value)}
                        placeholder="Judul Gerakan / Bab"
                        className="col-span-10 sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141416] border border-black/10 dark:border-white/10"
                        aria-label="Judul bagian"
                      />
                      <input
                        type="text"
                        value={sec.tempoOrTopic}
                        onChange={(e) => updateSectionRow(idx, 'tempoOrTopic', e.target.value)}
                        placeholder="Tempo / Topik (opsional)"
                        className="col-span-7 sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#141416] border border-black/10 dark:border-white/10"
                        aria-label="Tempo atau topik"
                      />
                      <div className="col-span-4 sm:col-span-2 flex items-center gap-1.5">
                        <span className="text-[11px] text-[#6E6E73] shrink-0">Hlm.</span>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, form.pageCount)}
                          value={sec.startPage}
                          onChange={(e) =>
                            updateSectionRow(idx, 'startPage', Number(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#141416] border border-black/10 dark:border-white/10 font-tabular"
                          aria-label="Halaman mulai"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSectionRow(idx)}
                          disabled={form.sections.length <= 1}
                          className="p-1.5 rounded-lg text-[#B42318] hover:bg-[#B42318]/10 disabled:opacity-30 cursor-pointer"
                          title="Hapus baris"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Submit Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2.5 rounded-lg bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 text-xs font-medium hover:bg-black/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingDocId ? 'Simpan Perubahan Metadata' : 'Publikasikan ke Gloriamus Library'}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PENGGUNA & PENGATURAN IZIN SCREENSHOT PER AKUN          */}
          {/* ============================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-editorial text-3xl font-semibold tracking-tight">
                    Manajemen Akun Pembaca & Otorisasi Screenshot
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    Aktifkan atau cabut hak akses tangkapan layar secara langsung untuk setiap akun
                    terdaftar. Seluruh tangkapan layar terotorisasi tetap membawa watermark ID
                    pembaca, sedangkan unduh PDF langsung dikunci permanen.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Akun Pembaca</span>
                </button>
              </div>

              {/* Inline Add New Reader Account Form */}
              {showAddUserForm && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-5 rounded-2xl bg-white dark:bg-[#161618] border border-[#0066CC]/35 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Daftarkan Akun Pembaca / Peneliti Baru</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(false)}
                      className="p-1 rounded-full hover:bg-black/5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nama Lengkap & Gelar"
                      className="px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Alamat Email Institusi"
                      className="px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                    <input
                      type="text"
                      value={newUserInstitution}
                      onChange={(e) => setNewUserInstitution(e.target.value)}
                      placeholder="Konservatori / Universitas"
                      className="px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 focus:outline-none focus:border-[#0066CC]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="px-3 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12"
                      >
                        <option value="member">Member Standar</option>
                        <option value="authorized_researcher">Peneliti Terotorisasi</option>
                        <option value="librarian">Librarian (Admin)</option>
                      </select>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUserRole === 'librarian' ? true : newUserCanScreenshot}
                          disabled={newUserRole === 'librarian'}
                          onChange={(e) => setNewUserCanScreenshot(e.target.checked)}
                          className="rounded accent-[#0066CC]"
                        />
                        <span>Berikan Hak Akses Screenshot (Dengan Watermark)</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold cursor-pointer"
                    >
                      Simpan Akun
                    </button>
                  </div>
                </form>
              )}

              {/* Users Permission Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#161618]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/8 dark:border-white/10 bg-[#F5F5F7]/70 dark:bg-[#1C1C1E]/70 text-[#6E6E73] dark:text-[#A1A1A6]">
                      <th className="py-3 px-4 font-semibold">Akun & Institusi</th>
                      <th className="py-3 px-4 font-semibold">Peran Akses</th>
                      <th className="py-3 px-4 font-semibold">Unduh PDF</th>
                      <th className="py-3 px-4 font-semibold">Izin Screenshot (DRM)</th>
                      <th className="py-3 px-4 font-semibold text-right">Simulasi Sesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    {users.map((acct) => {
                      const isCurrent = activeUser.id === acct.id;
                      return (
                        <tr
                          key={acct.id}
                          className={`transition-colors ${
                            isCurrent
                              ? 'bg-[#0066CC]/4 dark:bg-[#0066CC]/10'
                              : 'hover:bg-[#F5F5F7]/60 dark:hover:bg-white/4'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#1D1D1F] dark:text-white">
                              {acct.name}
                              {isCurrent && (
                                <span className="ml-2 text-[11px] font-medium text-[#0066CC] dark:text-[#409CFF]">
                                  (Sesi Aktif)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                              {acct.institution}
                            </div>
                            <div className="font-tabular text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                              {acct.email} · {acct.licenseToken}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {acct.role === 'guest' ? (
                              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">
                                Pengunjung Tamu (Belum Login)
                              </span>
                            ) : (
                              <select
                                value={acct.role}
                                onChange={(e) =>
                                  onChangeUserRole(acct.id, e.target.value as UserRole)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 text-xs"
                              >
                                <option value="member">Member Standar</option>
                                <option value="authorized_researcher">Peneliti Terotorisasi</option>
                                <option value="librarian">Head Librarian</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[#B42318] dark:text-[#F97066] font-medium">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Terkunci</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {acct.role === 'guest' ? (
                              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">
                                Diblokir (Wajib Login)
                              </span>
                            ) : (
                              <button
                                onClick={() => onToggleUserScreenshot(acct.id)}
                                className="inline-flex items-center gap-2.5 cursor-pointer group"
                              >
                                <span
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    acct.canScreenshot
                                      ? 'bg-[#15803D]'
                                      : 'bg-black/20 dark:bg-white/20'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                      acct.canScreenshot ? 'translate-x-4.5' : 'translate-x-1'
                                    }`}
                                  />
                                </span>
                                <span
                                  className={`font-medium ${
                                    acct.canScreenshot
                                      ? 'text-[#15803D] dark:text-[#4ADE80]'
                                      : 'text-[#B45309] dark:text-[#FBBF24]'
                                  }`}
                                >
                                  {acct.canScreenshot ? 'Diizinkan' : 'Diblokir'}
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => onSwitchActiveUser(acct.id)}
                              disabled={isCurrent}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 text-xs font-medium transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isCurrent ? 'Sedang Aktif' : 'Uji Akun Ini'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: AUDIT KEAMANAN DRM & SKEMA POSTGRESQL                   */}
          {/* ============================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-editorial text-3xl font-semibold tracking-tight">
                    Audit Keamanan DRM & Pelanggaran Hak Cipta
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    Rekaman langsung setiap pencegahan unduh/cetak, blokir tangkapan layar tanpa
                    izin, pemicuan perisai blur fokus, serta cuplikan layar berlisensi.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSqlSchema(!showSqlSchema)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/12 text-xs font-medium hover:border-[#0066CC] transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#409CFF]" />
                    <span>{showSqlSchema ? 'Tutup Skema SQL' : 'Lihat Skema PostgreSQL'}</span>
                  </button>
                  {securityLogs.length > 0 && (
                    <button
                      onClick={onClearSecurityLogs}
                      className="px-3.5 py-2 rounded-lg border border-[#B42318]/25 text-[#B42318] dark:text-[#F97066] hover:bg-[#B42318]/8 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Bersihkan Log
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Column Audit Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Total Kejadian</div>
                  <div className="font-tabular text-2xl font-semibold">{securityLogs.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    Blokir Unduh / Cetak
                  </div>
                  <div className="font-tabular text-2xl font-semibold text-[#B42318] dark:text-[#F97066]">
                    {blockedDownloadPrintCount}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    Blokir Screenshot / Blur
                  </div>
                  <div className="font-tabular text-2xl font-semibold text-[#B45309] dark:text-[#FBBF24]">
                    {blockedScreenshotCount}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 space-y-1">
                  <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    Capture Terotorisasi
                  </div>
                  <div className="font-tabular text-2xl font-semibold text-[#15803D] dark:text-[#4ADE80]">
                    {authorizedCaptureCount}
                  </div>
                </div>
              </div>

              {/* Collapsible PostgreSQL Schema Preview */}
              {showSqlSchema && (
                <div className="p-5 rounded-2xl bg-[#141416] text-[#E5E5EA] border border-white/10 space-y-2">
                  <div className="text-xs font-semibold text-[#D4A373]">
                    Skema Tabel PostgreSQL Gloriamus Library (Siap Integrasi Cloud SQL / Drizzle)
                  </div>
                  <pre className="font-tabular text-[11px] leading-relaxed overflow-x-auto">
                    {POSTGRES_SCHEMA_PREVIEW}
                  </pre>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/8 overflow-x-auto w-fit max-w-full">
                {(
                  [
                    ['ALL', 'Semua Kejadian'],
                    ['SHORTCUT_CAPTURE_BLOCKED', 'Screenshot Diblokir'],
                    ['PRINT_EXPORT_BLOCKED', 'Cetak/Unduh Diblokir'],
                    ['FOCUS_BLUR_SHIELD', 'Perisai Blur Fokus'],
                    ['AUTHORIZED_CAPTURE_WATERMARKED', 'Capture Terotorisasi'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setAuditFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      auditFilter === key
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                        : 'text-[#6E6E73] dark:text-[#A1A1A6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Audit Log Table */}
              <div className="overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#161618]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/8 dark:border-white/10 bg-[#F5F5F7]/70 dark:bg-[#1C1C1E]/70 text-[#6E6E73] dark:text-[#A1A1A6]">
                      <th className="py-3 px-4 font-semibold">Waktu</th>
                      <th className="py-3 px-4 font-semibold">Jenis Kejadian</th>
                      <th className="py-3 px-4 font-semibold">Akun Pengguna</th>
                      <th className="py-3 px-4 font-semibold">Keterangan Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 px-4 text-center text-[#6E6E73] dark:text-[#A1A1A6]"
                        >
                          Belum ada log keamanan untuk kategori ini. Coba uji klik kanan atau tombol
                          screenshot di dalam Studio Reader.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[#F5F5F7]/60 dark:hover:bg-white/4 transition-colors"
                        >
                          <td className="py-3 px-4 font-tabular text-[#6E6E73] dark:text-[#A1A1A6] whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {log.actionType === 'AUTHORIZED_CAPTURE_WATERMARKED' ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#15803D] dark:text-[#4ADE80]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Capture Terotorisasi</span>
                              </span>
                            ) : log.actionType === 'SHORTCUT_CAPTURE_BLOCKED' ||
                              log.actionType === 'FOCUS_BLUR_SHIELD' ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#B45309] dark:text-[#FBBF24]">
                                <Camera className="w-3.5 h-3.5" />
                                <span>
                                  {log.actionType === 'FOCUS_BLUR_SHIELD'
                                    ? 'Perisai Anti-Snipping'
                                    : 'Screenshot Diblokir'}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#B42318] dark:text-[#F97066]">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>
                                  {log.actionType === 'RIGHT_CLICK_BLOCKED'
                                    ? 'Klik Kanan Diblokir'
                                    : 'Unduh/Cetak Diblokir'}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium">
                              {log.userName || 'Sesi Pembaca'}
                            </div>
                            <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] capitalize">
                              {log.userRole.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="py-3 px-4 leading-relaxed text-[#1D1D1F] dark:text-[#E5E5EA]">
                            {log.message}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmDeleteDoc(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-editorial text-2xl font-semibold">Hapus Koleksi Permanen?</h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Dokumen <strong>“{confirmDeleteDoc.title}”</strong> ({confirmDeleteDoc.accessionNumber})
              akan dihapus dari daftar katalog Gloriamus Library. Jika Anda hanya ingin
              menyembunyikannya sementara, gunakan tombol <strong>Arsipkan</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-4 py-2 rounded-lg bg-[#F5F5F7] dark:bg-[#2C2C2E] text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteDocument(confirmDeleteDoc.id);
                  setConfirmDeleteDoc(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#B42318] hover:bg-[#912018] text-white text-xs font-semibold cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
