import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  UserCheck,
  Database,
  Check,
  ShieldAlert,
  Camera,
  FileLock2,
  Shield,
} from 'lucide-react';
import { UserSession, SecurityEventLog } from '../types/library';
import { POSTGRES_SCHEMA_PREVIEW } from '../data/libraryCatalog';

interface AccessPermissionModalProps {
  isOpen: boolean;
  users: UserSession[];
  currentSession: UserSession;
  securityLogs: SecurityEventLog[];
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onOpenAdminPanel: () => void;
}

export const AccessPermissionModal: React.FC<AccessPermissionModalProps> = ({
  isOpen,
  users,
  currentSession,
  securityLogs,
  onClose,
  onSelectUser,
  onOpenAdminPanel,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'schema'>('roles');

  if (!isOpen) return null;

  const roleLabels: Record<UserSession['role'], string> = {
    librarian: 'Head Librarian (Admin Pustakawan)',
    authorized_researcher: 'Peneliti Terotorisasi',
    member: 'Member Standar',
    guest: 'Pengunjung Tamu (Belum Login)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FBFBFD] dark:bg-[#161618] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-2xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/8 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileLock2 className="w-4 h-4 text-[#0066CC] dark:text-[#409CFF]" />
            <h2 className="text-sm font-semibold tracking-tight">
              Gloriamus Library — Sesi Akun, Hak Akses DRM & Skema PostgreSQL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Sub-Nav */}
        <div className="px-6 pt-4 pb-2 border-b border-black/6 dark:border-white/8 flex flex-wrap items-center justify-between gap-3 bg-[#F5F5F7]/60 dark:bg-[#121214]/60">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/6 dark:bg-white/10">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6]'
              }`}
            >
              Pilih Akun Sesi Aktif ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#A1A1A6]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Skema PostgreSQL & Log DRM</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAdminPanel();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066CC]/10 text-[#0066CC] dark:text-[#409CFF] hover:bg-[#0066CC]/18 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Buka Admin Pustakawan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'roles' ? (
            <>
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Pilih akun di bawah untuk langsung menguji perilaku proteksi hak cipta di dalam{' '}
                <strong>Studio Reader</strong>. Izin tangkapan layar tiap akun dapat diubah secara
                langsung dari menu <strong>Admin Pustakawan</strong>.
              </p>

              <div className="space-y-3">
                {users.map((acct) => {
                  const isSelected = currentSession.id === acct.id;

                  return (
                    <div
                      key={acct.id}
                      onClick={() => onSelectUser(acct.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0066CC]/6 dark:bg-[#0066CC]/15 border-[#0066CC] dark:border-[#409CFF]'
                          : 'bg-white dark:bg-[#1C1C1E] border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{acct.name}</span>
                            <span className="text-xs text-[#8C6239] dark:text-[#D4A373] font-medium">
                              · {roleLabels[acct.role]}
                            </span>
                          </div>
                          <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                            {acct.institution}
                          </div>
                          <div className="text-[11px] font-tabular text-[#6E6E73] dark:text-[#A1A1A6]">
                            {acct.email} · {acct.licenseToken}
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#0066CC] text-white'
                              : 'border border-black/20 dark:border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-black/6 dark:border-white/8 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#6E6E73]" />
                          <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Screenshot:</span>
                          <span
                            className={`font-medium ${
                              acct.canScreenshot
                                ? 'text-[#15803D] dark:text-[#4ADE80]'
                                : 'text-[#B45309] dark:text-[#FBBF24]'
                            }`}
                          >
                            {acct.canScreenshot
                              ? 'Diizinkan (Watermark ID Aktif)'
                              : acct.isLoggedIn
                              ? 'Diblokir (Belum Diberi Izin)'
                              : 'Diblokir + Anti-Snipping Shield'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#B42318] dark:text-[#F97066]" />
                          <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Unduh PDF:</span>
                          <span className="font-medium text-[#B42318] dark:text-[#F97066]">
                            Diblokir Permanen
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Log Aktivitas Perlindungan Hak Cipta ({securityLogs.length})
                </h3>
                {securityLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    Belum ada percobaan klik kanan, cetak, atau screenshot yang tercatat pada sesi
                    ini.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-black/6 dark:divide-white/8 border border-black/8 dark:border-white/10 rounded-xl bg-white dark:bg-[#1C1C1E]">
                    {securityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          {log.actionType === 'AUTHORIZED_CAPTURE_WATERMARKED' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" />
                          )}
                          <span>{log.message}</span>
                        </div>
                        <span className="font-tabular text-[11px] text-[#6E6E73] shrink-0">
                          {log.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Struktur Tabel PostgreSQL Gloriamus Library (Siap Integrasi)
                </h3>
                <pre className="p-4 rounded-xl bg-[#141416] text-[#E5E5EA] font-tabular text-[11px] leading-relaxed overflow-x-auto border border-white/10">
                  {POSTGRES_SCHEMA_PREVIEW}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-t border-black/8 dark:border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#A1A1A6]">
            <UserCheck className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#409CFF]" />
            <span>
              Sesi Aktif:{' '}
              <strong className="text-[#1D1D1F] dark:text-white">{currentSession.name}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
