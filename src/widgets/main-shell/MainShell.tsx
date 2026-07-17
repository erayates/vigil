import { nativeBridge } from '@/shared/lib/nativeBridge';
import { CampaignBoard } from '@/widgets/campaign-board/CampaignBoard';
import { CampaignSummary } from '@/widgets/campaign-summary/CampaignSummary';
import { CompanionStage } from '@/widgets/companion-stage/CompanionStage';
import { FocusChamber } from '@/widgets/focus-chamber/FocusChamber';
import './main-shell.css';

export function MainShell() {
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
          <button className="session-tab is-active" type="button" aria-current="page">
            <span aria-hidden="true">❧</span>
            <strong>Focus</strong>
          </button>
          <button
            className="session-tab"
            type="button"
            disabled
            title="Short break arrives in v0.2.0"
          >
            <span aria-hidden="true">☕</span>
            <strong>Short Break</strong>
          </button>
          <button
            className="session-tab"
            type="button"
            disabled
            title="Long break arrives in v0.2.0"
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
            aria-label="Statistics"
          >
            ▥
          </button>
          <button
            type="button"
            disabled
            title="Settings screen is scheduled for v0.2.0"
            aria-label="Settings"
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

      <main className="imperium-main">
        <CampaignBoard />
        <FocusChamber />
        <CompanionStage />
      </main>

      <CampaignSummary />

      <footer className="motto-ribbon">
        <span>DISCIPLINA EST VICTORIA</span>
        <small>v0.0.2 · PIXEL UI FOUNDATION</small>
      </footer>
    </div>
  );
}
