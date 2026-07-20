import { useDoctrineStore } from '@/features/doctrine/model/use-doctrine-store';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { useStartupNoticeStore } from '@/features/system/model/use-startup-notice-store';
import { nativeBridge } from '@/shared/lib/native-bridge';
import { CampaignBoard } from '@/widgets/campaign-board/campaign-board';
import { CampaignSummary } from '@/widgets/campaign-summary/campaign-summary';
import { CompanionStage } from '@/widgets/companion-stage/companion-stage';
import { FocusChamber } from '@/widgets/focus-chamber/focus-chamber';
import './main-shell.css';

export function MainShell() {
  const { phase, startBreak } = useFocusStore();
  const { shortBreakMinutes, longBreakMinutes } = useDoctrineStore();
  const startupNotice = useStartupNoticeStore((state) => state.notice);
  const dismissStartupNotice = useStartupNoticeStore((state) => state.dismiss);
  // Rest belongs between watches, so breaks start only when idle or just finished.
  const breakAvailable = phase === 'idle' || phase === 'complete';

  function takeBreak(minutes: number) {
    startBreak(minutes * 60);
    void nativeBridge.showCompanion();
  }

  return (
    <div className="imperium-shell">
      <header className="imperium-header">
        <div className="brand-command" data-tauri-drag-region>
          <span className="brand-laurel" aria-hidden="true">
            ❧
          </span>
          <img className="sprite" src="/assets/brand/vigil-mark-64.png" alt="" />
          <div>
            <strong>VIGIL FOCUS</strong>
            <span>DISCIPLINA · FOCUS · VICTORIA</span>
          </div>
          <span className="brand-laurel brand-laurel--right" aria-hidden="true">
            ❧
          </span>
        </div>

        <nav className="session-tabs" aria-label="Session mode">
          <button
            className={phase === 'break' ? 'session-tab' : 'session-tab is-active'}
            type="button"
            aria-current={phase === 'break' ? undefined : 'page'}
          >
            <span aria-hidden="true">❧</span>
            <strong>Focus</strong>
          </button>
          <button
            className={phase === 'break' ? 'session-tab is-active' : 'session-tab'}
            type="button"
            disabled={!breakAvailable}
            aria-label="Short Break"
            title={`Take a ${shortBreakMinutes}-minute short break`}
            onClick={() => takeBreak(shortBreakMinutes)}
          >
            <span aria-hidden="true">☕</span>
            <strong>Short Break</strong>
          </button>
          <button
            className="session-tab"
            type="button"
            disabled={!breakAvailable}
            aria-label="Long Break"
            title={`Take a ${longBreakMinutes}-minute long break`}
            onClick={() => takeBreak(longBreakMinutes)}
          >
            <span aria-hidden="true">⌂</span>
            <strong>Long Break</strong>
          </button>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            disabled
            title="Statistics screen is scheduled for v0.2.0"
            aria-label="Statistics — available in v0.2.0"
          >
            ▥
          </button>
          <button
            type="button"
            disabled
            title="Settings screen is scheduled for v0.2.0"
            aria-label="Settings — available in v0.2.0"
          >
            ⚙
          </button>
        </div>

        <div className="window-controls">
          <button
            type="button"
            onClick={() => void nativeBridge.minimizeMain()}
            aria-label="Minimize"
          >
            —
          </button>
          <button
            type="button"
            onClick={() => void nativeBridge.toggleMaximizeMain()}
            aria-label="Maximize"
          >
            □
          </button>
          <button type="button" onClick={() => void nativeBridge.closeMain()} aria-label="Close">
            ×
          </button>
        </div>
      </header>

      {startupNotice && (
        <div className="startup-notice" role="alert">
          <span>{startupNotice}</span>
          <button type="button" onClick={dismissStartupNotice}>
            Dismiss
          </button>
        </div>
      )}

      <main className="imperium-main">
        <CampaignBoard />
        <FocusChamber />
        <CompanionStage />
      </main>

      <CampaignSummary />

      <footer className="motto-ribbon">
        <span>DISCIPLINA EST VICTORIA</span>
        <small>v0.2.0 · DAILY-USE ALPHA</small>
      </footer>
    </div>
  );
}
