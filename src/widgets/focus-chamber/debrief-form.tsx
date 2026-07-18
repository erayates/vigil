import { useState } from 'react';
import type { DebriefFields } from '@/shared/lib/session-bridge';

interface DebriefFormProps {
  onRecord: (fields: DebriefFields) => void;
  onSkip: () => void;
}

// The closure ritual after a watch: log result, blocker and next action. Every
// field is optional so a fast "Record" (or "Skip") keeps closure under ~20s.
export function DebriefForm({ onRecord, onSkip }: DebriefFormProps) {
  const [result, setResult] = useState('');
  const [blocker, setBlocker] = useState('');
  const [nextAction, setNextAction] = useState('');

  return (
    <form
      className="debrief-form"
      aria-label="Watch debrief"
      onSubmit={(event) => {
        event.preventDefault();
        onRecord({ result, blocker, nextAction });
      }}
    >
      <label>
        <span>Result</span>
        <input
          value={result}
          maxLength={200}
          placeholder="What did you accomplish?"
          onChange={(event) => setResult(event.target.value)}
        />
      </label>
      <label>
        <span>Blocker</span>
        <input
          value={blocker}
          maxLength={200}
          placeholder="What got in the way?"
          onChange={(event) => setBlocker(event.target.value)}
        />
      </label>
      <label>
        <span>Next action</span>
        <input
          value={nextAction}
          maxLength={200}
          placeholder="What is the next step?"
          onChange={(event) => setNextAction(event.target.value)}
        />
      </label>
      <div className="debrief-actions">
        <button type="submit" className="control-button control-button--start">
          <strong>Record</strong>
        </button>
        <button type="button" className="control-button control-button--reset" onClick={onSkip}>
          <strong>Skip</strong>
        </button>
      </div>
    </form>
  );
}
