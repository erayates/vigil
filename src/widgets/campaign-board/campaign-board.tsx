import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { focusModes } from '@/entities/focus-session/model/modes';
import { useCampaignStore } from '@/features/campaign/model/use-campaign-store';
import { useCompanionPrefsStore } from '@/features/companion/model/use-companion-prefs-store';
import { useDoctrineStore } from '@/features/doctrine/model/use-doctrine-store';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { dataBridge } from '@/shared/lib/data-bridge';
import { isTauriRuntime } from '@/shared/lib/session-bridge';

export function CampaignBoard() {
  const {
    missionTitle,
    victoryCondition,
    modeId,
    customDurationMinutes,
    phase,
    setMissionTitle,
    setVictoryCondition,
    setModeId,
    setCustomDurationMinutes,
  } = useFocusStore();
  const { campaigns, activeId, createCampaign, setActiveCampaign } = useCampaignStore();
  const { shortBreakMinutes, longBreakMinutes, setDoctrine } = useDoctrineStore();
  const {
    side: companionSide,
    scale: companionScale,
    opacity: companionOpacity,
    setPrefs: setCompanionPrefs,
  } = useCompanionPrefsStore();
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newCampaign, setNewCampaign] = useState('');
  const [addingCampaign, setAddingCampaign] = useState(false);
  const activeMode = useMemo(() => focusModes.find((mode) => mode.id === modeId), [modeId]);
  const editingLocked = phase !== 'idle' && phase !== 'complete';
  const importInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const json = await dataBridge.export();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vigil-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be re-picked later
    if (!file) return;
    const summary = await dataBridge.import(await file.text());
    // The merge landed in SQLite; reload the webview to re-hydrate the stores.
    if (summary && isTauriRuntime()) window.location.reload();
  }

  return (
    <section
      className="campaign-board pixel-frame pixel-frame--stone"
      aria-labelledby="campaign-title"
    >
      <header className="panel-ribbon">
        <span aria-hidden="true">✦</span>
        <h2 id="campaign-title">Today&apos;s Campaign</h2>
        <span aria-hidden="true">✦</span>
      </header>

      <div className="campaign-selector">
        <label htmlFor="active-campaign" className="sr-only">
          Active campaign
        </label>
        <select
          id="active-campaign"
          value={activeId}
          onChange={(event) => setActiveCampaign(event.target.value)}
        >
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
        {addingCampaign ? (
          <form
            className="campaign-add"
            onSubmit={(event) => {
              event.preventDefault();
              createCampaign(newCampaign);
              setNewCampaign('');
              setAddingCampaign(false);
            }}
          >
            <input
              aria-label="New campaign name"
              value={newCampaign}
              maxLength={60}
              placeholder="Campaign name"
              onChange={(event) => setNewCampaign(event.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        ) : (
          <button type="button" onClick={() => setAddingCampaign(true)}>
            ＋ New campaign
          </button>
        )}
      </div>

      <div className="campaign-orders">
        <article className="campaign-order campaign-order--active">
          <div className="order-check" aria-hidden="true" />
          <div className="order-copy">
            <label htmlFor="mission-title" className="sr-only">
              Active mission
            </label>
            <input
              id="mission-title"
              className="order-title-input"
              value={missionTitle}
              disabled={editingLocked}
              maxLength={100}
              placeholder="Finish project proposal"
              onChange={(event) => setMissionTitle(event.target.value)}
            />
            <div className="order-meta">
              <span className={`priority-shield priority-shield--${priority.toLowerCase()}`} />
              <label htmlFor="mission-priority" className="sr-only">
                Mission priority
              </label>
              <select
                id="mission-priority"
                value={priority}
                disabled={editingLocked}
                onChange={(event) => setPriority(event.target.value as typeof priority)}
              >
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
              <span>PRIORITY</span>
            </div>
          </div>
          <span className="order-flag" aria-hidden="true">
            ⚑
          </span>
        </article>
      </div>

      <div className="victory-field">
        <label htmlFor="victory-condition">Victory condition</label>
        <textarea
          id="victory-condition"
          value={victoryCondition}
          disabled={editingLocked}
          maxLength={240}
          placeholder="What observable result will make this watch complete?"
          onChange={(event) => setVictoryCondition(event.target.value)}
        />
      </div>

      <fieldset className="formation-picker" disabled={editingLocked}>
        <legend>Focus formation</legend>
        {[
          ...focusModes,
          { id: 'custom', label: 'Custom', durationSeconds: customDurationMinutes * 60 },
        ].map((mode) => (
          <label
            className={modeId === mode.id ? 'formation-chip is-selected' : 'formation-chip'}
            key={mode.id}
          >
            <input
              type="radio"
              name="focus-mode"
              aria-label={`${mode.label}, ${mode.durationSeconds / 60} minutes`}
              checked={modeId === mode.id}
              onChange={() => setModeId(mode.id as typeof modeId)}
            />
            <strong>{mode.durationSeconds / 60}</strong>
            <span>MIN</span>
          </label>
        ))}
      </fieldset>

      {modeId === 'custom' ? (
        <div className="custom-duration-field">
          <label htmlFor="custom-duration">Custom minutes</label>
          <input
            id="custom-duration"
            type="number"
            min={1}
            max={240}
            value={customDurationMinutes}
            disabled={editingLocked}
            onChange={(event) => setCustomDurationMinutes(Number(event.target.value))}
          />
        </div>
      ) : (
        <p className="formation-description">{activeMode?.description}</p>
      )}

      <details className="board-settings">
        <summary>Settings &amp; preferences</summary>

        <div className="doctrine-field">
          <strong>Recovery doctrine</strong>
          <div className="doctrine-inputs">
            <label htmlFor="short-break">Short break (min)</label>
            <input
              key={`short-${shortBreakMinutes}`}
              id="short-break"
              type="number"
              min={1}
              max={120}
              defaultValue={shortBreakMinutes}
              onBlur={(event) =>
                setDoctrine(Number(event.target.value) || shortBreakMinutes, longBreakMinutes)
              }
            />
            <label htmlFor="long-break">Long break (min)</label>
            <input
              key={`long-${longBreakMinutes}`}
              id="long-break"
              type="number"
              min={1}
              max={120}
              defaultValue={longBreakMinutes}
              onBlur={(event) =>
                setDoctrine(shortBreakMinutes, Number(event.target.value) || longBreakMinutes)
              }
            />
          </div>
        </div>

        <div className="companion-field">
          <strong>Companion</strong>
          <div className="companion-controls">
            <label htmlFor="companion-side">Side</label>
            <select
              id="companion-side"
              value={companionSide}
              onChange={(event) =>
                setCompanionPrefs(
                  event.target.value === 'left' ? 'left' : 'right',
                  companionScale,
                  companionOpacity,
                )
              }
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <label htmlFor="companion-scale">Scale</label>
            <input
              id="companion-scale"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={companionScale}
              onChange={(event) =>
                setCompanionPrefs(companionSide, Number(event.target.value), companionOpacity)
              }
            />
            <label htmlFor="companion-opacity">Opacity</label>
            <input
              id="companion-opacity"
              type="range"
              min={0.3}
              max={1}
              step={0.1}
              value={companionOpacity}
              onChange={(event) =>
                setCompanionPrefs(companionSide, companionScale, Number(event.target.value))
              }
            />
          </div>
        </div>

        <div className="backup-field">
          <strong>Local data</strong>
          <div className="backup-actions">
            <button type="button" onClick={handleExport}>
              Export
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()}>
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="sr-only"
              aria-label="Import data file"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </details>

    </section>
  );
}
