import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  Info,
  Lock,
  ShieldCheck,
  Sun,
  Moon,
  X,
  Music,
  BookMarked,
  SlidersHorizontal,
  Shield,
} from 'lucide-react';
import {
  LibraryDocument,
  UserSession,
  UserRole,
  SecurityEventLog,
} from './types/library';
import {
  INITIAL_LIBRARY_DOCUMENTS,
  INITIAL_USER_ACCOUNTS,
  INITIAL_SECURITY_LOGS,
} from './data/libraryCatalog';
import { MetadataInspectorModal } from './components/MetadataInspectorModal';
import { StudioScoreReader } from './components/StudioScoreReader';
import { AccessPermissionModal } from './components/AccessPermissionModal';
import { LibrarianAdminWorkspace } from './components/LibrarianAdminWorkspace';

type NavFilter = 'all' | 'score' | 'book' | 'urtext';
type WorkspaceView = 'library' | 'admin';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('library');

  // Centralized Library, Users & Security Audit State (PostgreSQL-ready model)
  const [documents, setDocuments] = useState<LibraryDocument[]>(INITIAL_LIBRARY_DOCUMENTS);
  const [users, setUsers] = useState<UserSession[]>(INITIAL_USER_ACCOUNTS);
  const [activeUserId, setActiveUserId] = useState<string>(INITIAL_USER_ACCOUNTS[2].id); // Default: Standard Member
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(INITIAL_SECURITY_LOGS);

  // Public Catalog Filter State
  const [navFilter, setNavFilter] = useState<NavFilter>('all');
  const [eraFilter, setEraFilter] = useState<string>('All Eras');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Reader & Modals
  const [activeReaderDoc, setActiveReaderDoc] = useState<{
    doc: LibraryDocument;
    initialPage: number;
  } | null>(null);
  const [inspectedDoc, setInspectedDoc] = useState<LibraryDocument | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const userSession =
    users.find((u) => u.id === activeUserId) || users[0] || INITIAL_USER_ACCOUNTS[0];

  // Sync dark mode class with documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogSecurityEvent = useCallback(
    (event: Omit<SecurityEventLog, 'id' | 'timestamp'>) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setSecurityLogs((prev) => [
        {
          ...event,
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: timeStr,
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  // Librarian Document CRUD Handlers
  const handleCreateDocument = (newDoc: LibraryDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: LibraryDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    if (activeReaderDoc && activeReaderDoc.doc.id === updatedDoc.id) {
      setActiveReaderDoc({ doc: updatedDoc, initialPage: activeReaderDoc.initialPage });
    }
  };

  const handleToggleArchiveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, status: d.status === 'published' ? 'archived' : 'published' }
          : d
      )
    );
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (inspectedDoc?.id === docId) setInspectedDoc(null);
    if (activeReaderDoc?.doc.id === docId) setActiveReaderDoc(null);
  };

  // Librarian User & Screenshot Permission Handlers
  const handleToggleUserScreenshot = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId || u.role === 'guest') return u;
        const nextAllowed = !u.canScreenshot;
        return {
          ...u,
          canScreenshot: nextAllowed,
          licenseToken: nextAllowed
            ? u.licenseToken.replace('STD-READ', 'AUTH-CAPTURE')
            : u.licenseToken.replace('AUTH-CAPTURE', 'STD-READ'),
        };
      })
    );
  };

  const handleChangeUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          role,
          canScreenshot: role === 'librarian' || role === 'authorized_researcher' ? true : u.canScreenshot,
        };
      })
    );
  };

  const handleAddUser = (newUser: UserSession) => {
    setUsers((prev) => [...prev, newUser]);
  };

  // Publicly visible (published) documents only
  const publishedDocuments = useMemo(
    () => documents.filter((d) => d.status === 'published'),
    [documents]
  );

  // Featured Lead Document
  const featuredDoc = publishedDocuments[0] || documents[0];

  // Era / Field Options
  const availableEras = [
    'All Eras',
    'Baroque',
    'Classical',
    'Romantic',
    'Impressionist',
    'Contemporary',
    'Musicology & Acoustics',
  ];

  // Filtered Public Documents
  const filteredDocuments = useMemo(() => {
    return publishedDocuments.filter((doc) => {
      if (navFilter === 'score' && doc.category !== 'score') return false;
      if (navFilter === 'book' && doc.category !== 'book') return false;
      if (navFilter === 'urtext' && !doc.editionType.toLowerCase().includes('urtext')) {
        return false;
      }

      if (eraFilter !== 'All Eras' && doc.eraOrField !== eraFilter) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.subtitle.toLowerCase().includes(q) ||
          doc.creator.toLowerCase().includes(q) ||
          doc.catalogNumber.toLowerCase().includes(q) ||
          doc.instrumentation.toLowerCase().includes(q) ||
          doc.accessionNumber.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [publishedDocuments, navFilter, eraFilter, searchQuery]);

  const handleResetFilters = () => {
    setNavFilter('all');
    setEraFilter('All Eras');
    setSearchQuery('');
  };

  return (
    <>
      {workspaceView === 'admin' ? (
        <LibrarianAdminWorkspace
          documents={documents}
          users={users}
          activeUser={userSession}
          securityLogs={securityLogs}
          onBackToLibrary={() => setWorkspaceView('library')}
          onOpenReader={(doc, page = 1) => setActiveReaderDoc({ doc, initialPage: page })}
          onCreateDocument={handleCreateDocument}
          onUpdateDocument={handleUpdateDocument}
          onToggleArchiveDocument={handleToggleArchiveDocument}
          onDeleteDocument={handleDeleteDocument}
          onToggleUserScreenshot={handleToggleUserScreenshot}
          onChangeUserRole={handleChangeUserRole}
          onAddUser={handleAddUser}
          onSwitchActiveUser={(uid) => setActiveUserId(uid)}
          onClearSecurityLogs={() => setSecurityLogs([])}
        />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FBFBFD] dark:bg-[#0D0D0F] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-200">
          {/* Strict 3-Zone Top Bar Contract */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-[#FBFBFD]/82 dark:bg-[#0D0D0F]/82 backdrop-blur-xl border-b border-black/8 dark:border-white/10">
            {/* Zone 1: Single Text Element Wordmark */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                handleResetFilters();
              }}
              className="font-editorial text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap shrink-0"
            >
              Gloriamus Library
            </a>

            {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
              <button
                onClick={() => setNavFilter('all')}
                className={`hover:text-[#1D1D1F] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  navFilter === 'all'
                    ? 'text-[#1D1D1F] dark:text-white border-b-2 border-[#1D1D1F] dark:border-white font-semibold'
                    : ''
                }`}
              >
                Semua Koleksi
              </button>
              <button
                onClick={() => setNavFilter('score')}
                className={`hover:text-[#1D1D1F] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  navFilter === 'score'
                    ? 'text-[#1D1D1F] dark:text-white border-b-2 border-[#1D1D1F] dark:border-white font-semibold'
                    : ''
                }`}
              >
                Partitur Musik
              </button>
              <button
                onClick={() => setNavFilter('book')}
                className={`hover:text-[#1D1D1F] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  navFilter === 'book'
                    ? 'text-[#1D1D1F] dark:text-white border-b-2 border-[#1D1D1F] dark:border-white font-semibold'
                    : ''
                }`}
              >
                Buku Musikologi
              </button>
              <button
                onClick={() => setNavFilter('urtext')}
                className={`hover:text-[#1D1D1F] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  navFilter === 'urtext'
                    ? 'text-[#1D1D1F] dark:text-white border-b-2 border-[#1D1D1F] dark:border-white font-semibold'
                    : ''
                }`}
              >
                Edisi Urtext
              </button>
              <button
                onClick={() => setWorkspaceView('admin')}
                className="hover:text-[#0066CC] dark:hover:text-[#409CFF] text-[#1D1D1F] dark:text-[#E5E5EA] transition-colors whitespace-nowrap shrink-0 cursor-pointer font-semibold"
              >
                Admin Pustakawan
              </button>
            </nav>

            {/* Zone 3: 1 Primary Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D1D1F] dark:bg-white dark:text-[#1D1D1F] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                {userSession.canScreenshot ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80] dark:text-[#15803D]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#D4A373] dark:text-[#8C6239]" />
                )}
                <span>
                  {userSession.role === 'guest'
                    ? 'Masuk / Pilih Akses'
                    : userSession.canScreenshot
                    ? `${userSession.name.split(' ')[0]} (Capture Aktif)`
                    : `${userSession.name.split(' ')[0]} (Baca Saja)`}
                </span>
              </button>
            </div>
          </header>

          {/* Main Content Container (1440px Desktop Presence) */}
          <main
            id="top"
            className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-12 py-8 sm:py-12 space-y-14"
          >
            {/* Curatorial Exhibition Hero Section */}
            {featuredDoc && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pb-12 border-b border-black/8 dark:border-white/10">
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6 pr-0 lg:pr-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#8C6239] dark:text-[#D4A373]">
                      <span>GLORIAMUS ARCHIVAL CURATION</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-tabular">{featuredDoc.accessionNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>PROTEKSI DRM HAK CIPTA PENULIS</span>
                    </div>

                    <h1
                      className="font-editorial text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight leading-[1.08] text-[#1D1D1F] dark:text-[#F5F5F7]"
                      style={{ textWrap: 'balance' }}
                    >
                      Ketajaman Partitur Urtext dalam Ruang Baca Digital yang Tenang.
                    </h1>

                    <p className="text-base sm:text-lg text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed max-w-2xl">
                      Perpustakaan digital untuk musisi, pustakawan, dan peneliti musikologi.
                      Nikmati pembacaan partitur PDF beresolusi tinggi dengan tampilan dua halaman,
                      kertas gading hangat, dan kendali hak cipta terpusat.
                    </p>
                  </div>

                  {/* Featured Document Quick Preview & Action Strip */}
                  <div className="pt-4 border-t border-black/8 dark:border-white/10 space-y-4">
                    <div className="space-y-1">
                      <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] font-tabular">
                        Sorotan Katalog · {featuredDoc.creator} ({featuredDoc.catalogNumber})
                      </div>
                      <div className="font-editorial text-xl sm:text-2xl font-semibold">
                        {featuredDoc.title} — {featuredDoc.subtitle}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveReaderDoc({ doc: featuredDoc, initialPage: 1 })}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Baca Partitur di Studio Reader</span>
                      </button>

                      <button
                        onClick={() => setInspectedDoc(featuredDoc)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F5F5F7] dark:bg-[#1C1C1E] hover:bg-black/8 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/8 dark:border-white/10 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Info className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                        <span>Inspeksi Metadata ({featuredDoc.catalogNumber})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: High-Fidelity Archival Studio Photograph */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg bg-[#EBE6DF] dark:bg-[#1C1C1E] min-h-[300px] flex">
                  <img
                    src="/src/assets/images/hero_archival_score_studio_1795093346814.jpg"
                    alt="Partitur Urtext di atas meja konduktor kayu oak dan aluminium"
                    referrerPolicy="no-referrer"
                    className="w-full lg:h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 text-white">
                    <div className="text-[11px] font-tabular uppercase tracking-widest text-white/75">
                      GLORIAMUS STUDIO READER · REAL PDF & URTEXT
                    </div>
                    <div className="font-editorial text-lg font-medium mt-0.5">
                      Unggah PDF di Admin Pustakawan & Baca dengan Kertas Gading Ramah Mata
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Operational DRM, Admin Entry & Comfort Workspace Toolbar Strip */}
            <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#161618] border border-black/6 dark:border-white/8">
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Sesi Aktif:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {userSession.name}
                  </span>
                  <span className="text-[#6E6E73] dark:text-[#A1A1A6] font-tabular">
                    ({userSession.licenseToken})
                  </span>
                </div>

                <span
                  className="hidden sm:inline text-black/20 dark:text-white/20"
                  aria-hidden="true"
                >
                  |
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Hak Screenshot:</span>
                  {userSession.canScreenshot ? (
                    <span className="font-semibold text-[#15803D] dark:text-[#4ADE80]">
                      Diizinkan (Watermark Aktif)
                    </span>
                  ) : (
                    <span className="font-semibold text-[#B45309] dark:text-[#FBBF24]">
                      Terkunci — Dapat diatur di Admin Pustakawan
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => setWorkspaceView('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Librarian Admin (Unggah PDF)</span>
                </button>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#242428] border border-black/10 dark:border-white/10 text-xs font-medium hover:border-[#0066CC] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#409CFF]" />
                  <span>Ganti Akun Sesi</span>
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#242428] border border-black/10 dark:border-white/10 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                  title="Ubah Suasana Ruang Perpustakaan (Terang / Gelap)"
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
                      <span>Archival Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-[#6E6E73]" />
                      <span>Concert Dark</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Catalog Filter, Search & Era Selection Bar */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-editorial text-3xl font-semibold tracking-tight">
                    Katalog Arsip Digital & Monograf
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    Menampilkan{' '}
                    <span className="font-tabular font-semibold text-[#1D1D1F] dark:text-white">
                      {filteredDocuments.length}
                    </span>{' '}
                    dari <span className="font-tabular">{publishedDocuments.length}</span> koleksi
                    publik terverifikasi.
                  </p>
                </div>

                {/* Live Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-[#6E6E73] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, komponis, Op. 57, BWV, instrumen..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#161618] border border-black/10 dark:border-white/12 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#6E6E73] focus:outline-none focus:border-[#0066CC] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#6E6E73] cursor-pointer"
                      aria-label="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-black/8 dark:border-white/10">
                <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] dark:bg-[#161618] rounded-xl overflow-x-auto">
                  <button
                    onClick={() => setNavFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      navFilter === 'all'
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                        : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`}
                  >
                    Semua Dokumen ({publishedDocuments.length})
                  </button>
                  <button
                    onClick={() => setNavFilter('score')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      navFilter === 'score'
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                        : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Partitur Musik (Scores)</span>
                  </button>
                  <button
                    onClick={() => setNavFilter('book')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      navFilter === 'book'
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                        : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`}
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>Buku Referensi Musikologi</span>
                  </button>
                </div>

                {/* Era & Field Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {availableEras.map((era) => (
                    <button
                      key={era}
                      onClick={() => setEraFilter(era)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        eraFilter === era
                          ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F]'
                          : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/8'
                      }`}
                    >
                      {era}
                    </button>
                  ))}
                </div>
              </div>

              {/* Populated Catalog Grid vs Empty State */}
              {filteredDocuments.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-2xl border border-black/8 dark:border-white/10 bg-[#F5F5F7]/50 dark:bg-[#161618]/50 space-y-4">
                  <div className="font-editorial text-2xl font-semibold">
                    Tidak Ada Partitur atau Buku yang Cocok
                  </div>
                  <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-md mx-auto">
                    Pencarian untuk &ldquo;{searchQuery}&rdquo; pada kategori ini tidak menemukan
                    hasil. Cobalah kata kunci lain atau kembalikan filter ke seluruh koleksi.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold hover:bg-[#0055B3] transition-colors cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredDocuments.map((doc) => (
                    <article
                      key={doc.id}
                      className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#161618] border border-black/8 dark:border-white/10 overflow-hidden hover:border-black/20 dark:hover:border-white/25 transition-colors"
                    >
                      <div>
                        {/* Cover Showcase Container */}
                        <div
                          onClick={() => setActiveReaderDoc({ doc, initialPage: 1 })}
                          className="relative aspect-[4/3] bg-[#EFECE6] dark:bg-[#1E1E22] overflow-hidden cursor-pointer border-b border-black/6 dark:border-white/8 flex items-center justify-center p-6"
                        >
                          <img
                            src={doc.coverImage}
                            alt={doc.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-auto object-contain rounded shadow-[0_12px_28px_rgba(0,0,0,0.18)] group-hover:scale-[1.03] transition-transform duration-200"
                          />
                          <span className="absolute top-3 right-3.5 font-tabular text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                            {doc.accessionNumber}
                          </span>
                        </div>

                        {/* Card Body with Zero-Pill Metadata Discipline */}
                        <div className="p-6 space-y-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8C6239] dark:text-[#D4A373] font-medium">
                            <span>
                              {doc.category === 'score' ? 'Partitur Musik' : 'Buku Referensi'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{doc.eraOrField}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-tabular">{doc.catalogNumber}</span>
                            {doc.sourceType === 'uploaded_pdf' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#0066CC] dark:text-[#409CFF]">PDF Asli</span>
                              </>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h3
                              onClick={() => setActiveReaderDoc({ doc, initialPage: 1 })}
                              className="font-editorial text-2xl font-semibold tracking-tight leading-snug group-hover:text-[#0066CC] dark:group-hover:text-[#409CFF] transition-colors cursor-pointer"
                            >
                              {doc.title}
                            </h3>
                            <p className="text-xs font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">
                              {doc.creator}{' '}
                              {doc.creatorDates && (
                                <span className="text-[#6E6E73] dark:text-[#A1A1A6] font-normal font-tabular">
                                  ({doc.creatorDates})
                                </span>
                              )}
                            </p>
                          </div>

                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] line-clamp-2 leading-relaxed">
                            {doc.synopsis}
                          </p>

                          <div className="pt-2 border-t border-black/6 dark:border-white/8 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                            <span>{doc.instrumentation.split('(')[0].trim()}</span>
                            <span aria-hidden="true">·</span>
                            <span>{doc.keySignature}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-tabular">{doc.pageCount} Halaman</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Action Row */}
                      <div className="px-6 py-4 bg-[#FBFBFD] dark:bg-[#121214] border-t border-black/6 dark:border-white/8 flex items-center justify-between gap-3">
                        <button
                          onClick={() => setInspectedDoc(doc)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Detail Metadata</span>
                        </button>

                        <button
                          onClick={() => setActiveReaderDoc({ doc, initialPage: 1 })}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Dokumen</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Structured Archival Table View */}
            <section className="space-y-4 pt-6 border-t border-black/8 dark:border-white/10">
              <div className="space-y-0.5">
                <h2 className="font-editorial text-2xl font-semibold">
                  Indeks Katalog & Status Hak Cipta
                </h2>
                <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                  Ringkasan metadata tabular untuk pencarian cepat nomor katalog, tonika, dan
                  penerbit edisi kritis.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#161618]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/8 dark:border-white/10 text-[#6E6E73] dark:text-[#A1A1A6] bg-[#F5F5F7]/60 dark:bg-[#1C1C1E]/60">
                      <th className="py-3 px-4 font-semibold">Aksesi / Katalog</th>
                      <th className="py-3 px-4 font-semibold">Judul Dokumen</th>
                      <th className="py-3 px-4 font-semibold">Komponis / Penulis</th>
                      <th className="py-3 px-4 font-semibold">Instrumen & Tonika</th>
                      <th className="py-3 px-4 font-semibold text-right">Halaman</th>
                      <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 dark:divide-white/8">
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={`row-${doc.id}`}
                        className="hover:bg-[#F5F5F7]/70 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-tabular whitespace-nowrap">
                          <div className="font-medium text-[#1D1D1F] dark:text-white">
                            {doc.catalogNumber}
                          </div>
                          <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                            {doc.accessionNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1D1D1F] dark:text-white">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                            {doc.editionType} · {doc.publisher} ({doc.publicationYear})
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>{doc.creator}</div>
                          {doc.creatorDates && (
                            <div className="font-tabular text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                              {doc.creatorDates}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>{doc.instrumentation.split('(')[0]}</div>
                          <div className="text-[11px] text-[#8C6239] dark:text-[#D4A373]">
                            {doc.keySignature}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-tabular text-right whitespace-nowrap">
                          {doc.pageCount} hlm.
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setInspectedDoc(doc)}
                              className="px-2.5 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors cursor-pointer"
                            >
                              Metadata
                            </button>
                            <button
                              onClick={() => setActiveReaderDoc({ doc, initialPage: 1 })}
                              className="px-2.5 py-1 rounded-md bg-[#0066CC] text-white font-medium hover:bg-[#0055B3] text-xs transition-colors cursor-pointer"
                            >
                              Baca
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          {/* Quiet Editorial Footer */}
          <footer className="mt-16 border-t border-black/8 dark:border-white/10 py-8 px-6 lg:px-12 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-editorial text-base font-bold text-[#1D1D1F] dark:text-white">
                  Gloriamus Library
                </span>
                <span aria-hidden="true">·</span>
                <span>Perpustakaan Digital Partitur Urtext & Literatur Musikologi</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span>Unduh Langsung Dinonaktifkan (Perlindungan Hak Cipta)</span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setWorkspaceView('admin')}
                  className="text-[#0066CC] dark:text-[#409CFF] hover:underline cursor-pointer"
                >
                  Masuk ke Admin Pustakawan
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Metadata Inspector Drawer Modal */}
      <MetadataInspectorModal
        document={inspectedDoc}
        userSession={userSession}
        onClose={() => setInspectedDoc(null)}
        onOpenReader={(doc, page = 1) => {
          setInspectedDoc(null);
          setActiveReaderDoc({ doc, initialPage: page });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Full-Screen Interactive Protected Studio Reader (accessible from both Public Library & Librarian Admin) */}
      {activeReaderDoc && (
        <StudioScoreReader
          document={activeReaderDoc.doc}
          initialPage={activeReaderDoc.initialPage}
          userSession={userSession}
          onClose={() => setActiveReaderDoc(null)}
          onOpenInspector={(doc) => setInspectedDoc(doc)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogSecurityEvent={handleLogSecurityEvent}
        />
      )}

      {/* Login Session Switcher, DRM Policy & PostgreSQL Schema Modal */}
      <AccessPermissionModal
        isOpen={isAuthModalOpen}
        users={users}
        currentSession={userSession}
        securityLogs={securityLogs}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={(uid) => setActiveUserId(uid)}
        onOpenAdminPanel={() => setWorkspaceView('admin')}
      />
    </>
  );
}
