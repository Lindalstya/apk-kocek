import React, { useEffect } from 'react';
import { X, Bell, CheckCheck, Trash2, Send } from 'lucide-react';
import { useKocek } from '../context/KocekContext';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
    sendNotification,
    theme,
  } = useKocek();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      markNotificationsAsRead();
    }
  }, [isOpen, markNotificationsAsRead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`rounded-t-3xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border transition-colors ${
          isDark ? 'bg-[#12151C] text-slate-100 border-[#252A36]' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#00F0D0]/15 text-[#00F0D0]' : 'bg-teal-50 text-teal-700'}`}>
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Notifikasi & Pengingat
              </h3>
              <span className={`text-[10px] block ${isDark ? 'text-[#8E97A6]' : 'text-slate-400'}`}>
                {notifications.length} pemberitahuan
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action button to test send notification */}
        <div className={`px-4 pt-3 pb-1 flex items-center justify-between border-b ${isDark ? 'border-[#252A36]' : 'border-slate-100'}`}>
          <span className={`text-[11px] font-semibold ${isDark ? 'text-[#8E97A6]' : 'text-slate-500'}`}>
            Simulasi Pengingat
          </span>
          <button
            type="button"
            onClick={() => {
              sendNotification({
                title: 'Pengingat Tabungan Baru 👾',
                message: 'Mochi menyapa: Sisa budget bulan ini aman! Sisihkan Rp25.000 lagi untuk target Laptop impianmu.',
                icon: '🚀',
                type: 'mochi',
              });
            }}
            className="text-[11px] font-bold text-[#00F0D0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Kirim Notifikasi Tes</span>
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-3xl block">📭</span>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tidak ada notifikasi saat ini
              </p>
              <button
                type="button"
                onClick={() => sendNotification()}
                className="btn-cyan-pill py-1.5 px-3 text-xs mt-2"
              >
                + Buat Notifikasi Baru
              </button>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors relative group ${
                  isDark
                    ? n.read
                      ? 'bg-[#181B24]/70 border-[#252A36] text-slate-300'
                      : 'bg-[#181B24] border-[#00F0D0]/30 text-white'
                    : n.read
                    ? 'bg-[#F8FAFC] border-slate-200/60 text-slate-600'
                    : 'bg-teal-50/50 border-teal-200 text-slate-900'
                }`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {n.message}
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 transition-opacity"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className={`p-3 border-t text-center ${isDark ? 'border-[#252A36] bg-[#0E1116]' : 'border-slate-100 bg-slate-50'}`}>
            <button
              onClick={markNotificationsAsRead}
              className={`text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto ${
                isDark ? 'text-[#00F0D0] hover:underline' : 'text-teal-700 hover:underline'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Semua sudah dibaca</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

