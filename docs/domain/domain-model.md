# Domain Model

## Aggregates

### Mission

Represents a concrete outcome the user intends to advance.

Core fields:

- id
- title
- victoryCondition
- campaignId (v0.2+)
- status
- createdAt
- completedAt

### FocusSession

Represents one bounded attempt to focus on one mission.

Core fields:

- id
- missionId or embedded mission snapshot
- mode
- plannedDuration
- actualFocusedDuration
- state
- startedAt
- pausedIntervals
- completedAt
- outcome

### Doctrine

User-configurable work and recovery rules.

### Campaign

Long-term project container introduced in v0.2.0.

### Progression

Disciplina, rank and camp state introduced in v0.3.0.

## Invariants

1. At most one active focus session exists.
2. An active focus session belongs to exactly one mission.
3. Completed duration cannot be negative or exceed wall-clock active time.
4. Pause intervals cannot overlap.
5. A completed session is immutable except for explicit correction metadata.
6. Progression is derived from accepted session records, not UI clicks.
7. Abandonment never deletes work already recorded.

## Bounded contexts

- Session Management
- Mission Management
- Campaign Planning
- Progression
- Companion Presentation
- OS Integration
- Persistence
