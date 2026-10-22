import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleResetAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080B0F] text-white flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-sm w-full bg-[#0E1116] border border-[#252A36] rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00F0D0]/15 text-[#00F0D0] flex items-center justify-center mx-auto text-2xl">
              👾
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Kocek Siap Dimulai Ulang</h2>
              <p className="text-xs text-slate-400 mt-1">
                Terjadi penyesuaian tampilan. Klik tombol di bawah untuk mulai dari awal dengan lancar.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleResetAll}
                className="w-full py-3 rounded-2xl bg-[#00F0D0] text-[#06231F] font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00F0D0]/20 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Mulai Ulang dari Awal (Reset & Buka)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 rounded-2xl border border-[#252A36] text-slate-300 hover:text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
