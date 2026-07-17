# ADR-003: Timestamp-derived timer

**Status:** Accepted

The timer is derived from start time and pause intervals. UI intervals only trigger recalculation. This prevents drift during throttling, sleep, blocked rendering and delayed callbacks.
