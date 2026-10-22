import React, { useState, useEffect } from 'react';
import { KocekProvider, useKocek } from './context/KocekContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BerandaView } from './components/BerandaView';
import { TransaksiView } from './components/TransaksiView';
import { AnalisisView } from './components/AnalisisView';
import { AkunView } from './components/AkunView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { MochiModal } from './components/MochiModal';
import { SavingGoalsModal } from './components/SavingGoalsModal';
import { NotificationModal } from './components/NotificationModal';
import { NotificationToast } from './components/NotificationToast';
import { AuthScreen } from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { NabungModal } from './components/NabungModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { Transaction, TransactionType } from './types';

function MainApp() {
  const { theme, savingGoals, sendNotification } = useKocek();

  const [activeTab, setActiveTab] = useState<'beranda' | 'transaksi' | 'analisis' | 'akun'>('beranda');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'manual' | 'receipt' | 'voice'>('manual');
  const [addInitialDate, setAddInitialDate] = useState<string | undefined>(undefined);
  const [addInitialCategory, setAddInitialCategory] = useState<string | undefined>(undefined);
  const [addInitialNote, setAddInitialNote] = useState<string | undefined>(undefined);
  const [addInitialAmount, setAddInitialAmount] = useState<number | undefined>(undefined);
  const [addInitialType, setAddInitialType] = useState<TransactionType | undefined>(undefined);
  const [addLockType, setAddLockType] = useState<TransactionType | undefined>(undefined);
  const [addSavingGoalId, setAddSavingGoalId] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isMochiModalOpen, setIsMochiModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isNabungModalOpen, setIsNabungModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedNabungGoalId, setSelectedNabungGoalId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [transaksiQuery, setTransaksiQuery] = useState('');
  const [transaksiViewMode, setTransaksiViewMode] = useState<'calendar' | 'list'>('calendar');
  const [transaksiInitialDate, setTransaksiInitialDate] = useState<string | undefined>(undefined);

  // Fresh welcome notification for new users
  useEffect(() => {
    const hasTriggered = sessionStorage.getItem('kocek_notif_sent_turn');
    if (!hasTriggered) {
      sessionStorage.setItem('kocek_notif_sent_turn', 'true');
      const timer = setTimeout(() => {
        sendNotification({
          title: 'Halo dari Dasai Mochi! 👾',
          message: 'Selamat datang di Kocek! Mulai catat pengeluaran dan impian tabunganmu dari nol dengan rapi.',
          icon: '✨',
          type: 'mochi',
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sendNotification]);

  const openAddModal = (
    mode: 'manual' | 'receipt' | 'voice' = 'manual',
    date?: string,
    category?: string,
    note?: string,
    amount?: number,
    initialType?: TransactionType,
    lockType?: TransactionType
  ) => {
    setAddSavingGoalId(null);
    setAddModalTab(mode);
    setAddInitialDate(date);
    setAddInitialCategory(category);
    setAddInitialNote(note);
    setAddInitialAmount(amount);
    setAddInitialType(initialType);
    setAddLockType(lockType);
    setIsAddModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    openAddModal(
      'manual',
      undefined,
      'Gaji / Pemasukan',
      'Pemasukan / Saldo Awal',
      undefined,
      'income',
      'income'
    );
  };

  const handleDepositToGoal = (goalId?: string) => {
    setSelectedNabungGoalId(goalId || null);
    setIsNabungModalOpen(true);
  };

  const handleSearchFromHome = (query: string) => {
    setTransaksiQuery(query);
    setTransaksiViewMode('list');
    setActiveTab('transaksi');
  };

  const handleNavigateToCalendar = (date?: string) => {
    setTransaksiQuery('');
    setTransaksiViewMode('calendar');
    if (date) {
      setTransaksiInitialDate(date);
    }
    setActiveTab('transaksi');
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen sm:py-4 flex justify-center transition-colors duration-200 selection:bg-[#00F0D0] selection:text-[#0E1116] ${
        isDark ? 'bg-[#080B0F] text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-md min-h-screen sm:min-h-[900px] flex flex-col relative shadow-2xl sm:rounded-[36px] sm:border overflow-hidden transition-colors duration-200 ${
          isDark ? 'bg-[#0E1116] border-[#252A36]' : 'bg-[#F8FAFC] border-slate-200'
        }`}
      >
        {/* In-App Floating Notification Banner */}
        <NotificationToast onOpenNotifications={() => setIsNotificationsOpen(true)} />

        {/* Header only for non-beranda or global */}
        {activeTab !== 'beranda' && (
          <Header
            onOpenMochiModal={() => setIsMochiModalOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 overflow-y-auto">
          {activeTab === 'beranda' && (
            <BerandaView
              onSearch={handleSearchFromHome}
              onSelectTransaction={tx => setSelectedTx(tx)}
              onOpenAddModal={openAddModal}
              onOpenAddIncome={handleOpenAddIncome}
              onOpenMochiModal={() => setIsMochiModalOpen(true)}
              onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
              onOpenNabungModal={handleDepositToGoal}
              onNavigateToAnalysis={() => setActiveTab('analisis')}
              onNavigateToCalendar={handleNavigateToCalendar}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
            />
          )}

          {activeTab === 'transaksi' && (
            <TransaksiView
              onOpenAddModal={openAddModal}
              initialQuery={transaksiQuery}
              initialView={transaksiViewMode}
              initialDate={transaksiInitialDate}
              onSelectTransaction={tx => setSelectedTx(tx)}
            />
          )}

          {activeTab === 'analisis' && <AnalisisView />}

          {activeTab === 'akun' && (
            <AkunView
              onOpenMochiModal={() => setIsMochiModalOpen(true)}
              onOpenResetModal={() => setIsResetModalOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={tab => {
            setTransaksiQuery('');
            setActiveTab(tab as any);
          }}
          onOpenAddModal={() => openAddModal('manual')}
        />

        {/* Modals */}
        {isAddModalOpen && (
          <AddTransactionModal
            isOpen={isAddModalOpen}
            initialTab={addModalTab}
            initialDate={addInitialDate}
            initialCategory={addInitialCategory}
            initialNote={addInitialNote}
            initialAmount={addInitialAmount}
            initialType={addInitialType}
            lockType={addLockType}
            savingGoalId={addSavingGoalId}
            onClose={() => {
              setIsAddModalOpen(false);
              setAddSavingGoalId(null);
              setAddInitialType(undefined);
              setAddLockType(undefined);
            }}
          />
        )}

        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />

        <MochiModal
          isOpen={isMochiModalOpen}
          onClose={() => setIsMochiModalOpen(false)}
        />

        <SavingGoalsModal
          isOpen={isGoalsModalOpen}
          onClose={() => setIsGoalsModalOpen(false)}
          onOpenDeposit={handleDepositToGoal}
        />

        <NabungModal
          isOpen={isNabungModalOpen}
          onClose={() => {
            setIsNabungModalOpen(false);
            setSelectedNabungGoalId(null);
          }}
          initialGoalId={selectedNabungGoalId}
          onOpenCreateGoal={() => {
            setIsNabungModalOpen(false);
            setIsGoalsModalOpen(true);
          }}
          onOpenAddIncome={() => {
            setIsNabungModalOpen(false);
            handleOpenAddIncome();
          }}
        />

        <NotificationModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        <ResetConfirmModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [isSplashing, setIsSplashing] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem('kocek_auth_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleLogout = () => {
      try {
        localStorage.removeItem('kocek_auth_v1');
      } catch (e) {
        console.warn(e);
      }
      setCurrentUser(null);
      setIsSplashing(false);
    };

    const handleRestart = () => {
      try {
        localStorage.removeItem('kocek_auth_v1');
        localStorage.removeItem('kocek_transactions_v1');
        localStorage.removeItem('kocek_saving_goals_v1');
        localStorage.removeItem('kocek_budget_v1');
        localStorage.removeItem('kocek_notifications_v1');
        sessionStorage.clear();
      } catch (e) {
        console.warn(e);
      }
      setCurrentUser(null);
      setIsSplashing(true);
    };

    const handleShowSplash = () => {
      setIsSplashing(true);
    };

    window.addEventListener('kocek-logout', handleLogout);
    window.addEventListener('kocek-restart', handleRestart);
    window.addEventListener('kocek-splash', handleShowSplash);
    return () => {
      window.removeEventListener('kocek-logout', handleLogout);
      window.removeEventListener('kocek-restart', handleRestart);
      window.removeEventListener('kocek-splash', handleShowSplash);
    };
  }, []);

  const handleLoginSuccess = (user: { name: string; email: string }) => {
    try {
      localStorage.setItem('kocek_auth_v1', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(user);
    setIsSplashing(false);
  };

  // 1. Show Splash Screen first on application mount or restart
  if (isSplashing) {
    return <SplashScreen onComplete={() => setIsSplashing(false)} />;
  }

  // 2. If not logged in, show Onboarding / Auth screen
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        onShowSplash={() => setIsSplashing(true)}
      />
    );
  }

  // 3. Main Application once logged in
  return (
    <KocekProvider key={currentUser.email}>
      <MainApp />
    </KocekProvider>
  );
}
