import React from 'react';
import FlappyElephantGame from './components/FlappyElephantGame';

interface ErrorBoundaryState {
  hasError: boolean;
}

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0F172A] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-extrabold text-white">Bir sorun oluştu</h2>
            <p className="mt-2 text-sm text-slate-400">
              Oyun yüklenirken beklenmedik bir hata meydana geldi.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GameErrorBoundary>
      <main className="min-h-screen w-full bg-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <FlappyElephantGame />
      </main>
    </GameErrorBoundary>
  );
}
