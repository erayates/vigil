import { pauseAnimationsWhenUnfocused } from '@/shared/lib/pause-when-unfocused';
import { CompanionOverlay } from '@/widgets/companion-overlay/companion-overlay';
import { MainShell } from '@/widgets/main-shell/main-shell';

function currentView(): 'main' | 'companion' {
  return new URLSearchParams(window.location.search).get('window') === 'companion'
    ? 'companion'
    : 'main';
}

const view = currentView();
if (view === 'main') pauseAnimationsWhenUnfocused();

export function App() {
  return view === 'companion' ? <CompanionOverlay /> : <MainShell />;
}
