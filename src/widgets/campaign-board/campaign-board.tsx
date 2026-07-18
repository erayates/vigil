import { useMemo, useState } from 'react';
import { focusModes } from '@/entities/focus-session/model/modes';
import { useCampaignStore } from '@/features/campaign/model/use-campaign-store';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';

const queuedOrders = [
  { title: 'Review design mockups', priority: 'MEDIUM' },
  { title: 'Write documentation', priority: 'MEDIUM' },
  { title: "Plan tomorrow's tasks", priority: 'LOW' },
] as const;

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
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newCampaign, setNewCampaign] = useState('');
  const [addingCampaign, setAddingCampaign] = useState(false);
  const activeMode = useMemo(() => focusModes.find((mode) => mode.id === modeId), [modeId]);
  const editingLocked = phase !== 'idle' && phase !== 'complete';

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

        {queuedOrders.map((order) => (
          <article className="campaign-order campaign-order--queued" key={order.title}>
            <div className="order-check" aria-hidden="true" />
            <div className="order-copy">
              <strong>{order.title}</strong>
              <div className="order-meta">
                <span
                  className={`priority-shield priority-shield--${order.priority.toLowerCase()}`}
                />
                <span>{order.priority}</span>
              </div>
            </div>
          </article>
        ))}
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

      <footer className="campaign-board-footer">
        <button
          type="button"
          disabled
          aria-label="Add task — available in v0.2.0"
          title="Task queue editing is planned for v0.2.0"
        >
          <span aria-hidden="true">＋</span> Add task
        </button>
        <strong>{1 + queuedOrders.length} tasks</strong>
      </footer>
    </section>
  );
}
