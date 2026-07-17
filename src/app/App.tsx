import { CompanionOverlay } from '@/widgets/companion-overlay/CompanionOverlay';
import { MainShell } from '@/widgets/main-shell/MainShell';

function currentView(): 'main' | 'companion' {
  return new URLSearchParams(window.location.search).get('window') === 'companion'
    ? 'companion'
    : 'main';
}

export function App() {
  return currentView() === 'companion' ? <CompanionOverlay /> : <MainShell />;
}
