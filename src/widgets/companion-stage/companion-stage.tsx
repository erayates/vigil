import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { nativeBridge } from '@/shared/lib/native-bridge';
import { PixelCompanion } from '@/widgets/pixel-companion/pixel-companion';
import '@/widgets/pixel-companion/pixel-companion.css';

const messageByPhase = {
  idle: 'Hold the line, legionary.',
  preparing: 'Form the line.',
  focusing: 'One order. No retreat.',
  paused: 'Regroup, then resume.',
  break: 'Recovery is discipline.',
  complete: 'The watch is complete.',
  abandoned: 'Reform the line.',
  debrief: 'Record the debrief.',
} as const;

export function CompanionStage() {
  const phase = useFocusStore((state) => state.phase);

  return (
    <aside
      className="companion-stage-panel pixel-frame pixel-frame--stone"
      aria-label="Roman focus companion"
    >
      <div className="companion-message" aria-live="polite">
        {messageByPhase[phase]}
      </div>
      <div className="standard-banner" aria-hidden="true">
        <span>SPQR</span>
        <strong>V</strong>
      </div>
      <div className="companion-figure">
        <PixelCompanion phase={phase} size="large" />
      </div>
      <div className="pixel-brazier" aria-hidden="true">
        <span className="flame flame--one" />
        <span className="flame flame--two" />
        <i />
      </div>
      <button
        className="companion-recall"
        type="button"
        title="Bring the companion back and turn off click-through if it stopped responding to the mouse"
        onClick={() => {
          void nativeBridge.showCompanion();
          void nativeBridge.setCompanionClickThrough(false);
        }}
      >
        Recall companion
      </button>
    </aside>
  );
}
