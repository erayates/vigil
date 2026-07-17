use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Idle,
    Focusing,
    Paused,
    Complete,
}

#[derive(Debug, PartialEq, Eq)]
pub enum SessionError {
    InvalidTransition,
}

#[derive(Clone, Debug)]
pub struct SessionState {
    pub phase: Phase,
    pub mission_title: String,
    pub victory_condition: String,
    pub planned_duration_secs: u64,
    pub started_at_ms: Option<i64>,
    pub total_paused_ms: i64,
    pub pause_started_at_ms: Option<i64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSnapshot {
    pub phase: Phase,
    pub mission_title: String,
    pub victory_condition: String,
    pub planned_duration_secs: u64,
    pub started_at_ms: Option<i64>,
    pub total_paused_ms: i64,
    pub pause_started_at_ms: Option<i64>,
    pub remaining_secs: u64,
}

impl SessionState {
    pub fn idle() -> Self {
        Self {
            phase: Phase::Idle,
            mission_title: String::new(),
            victory_condition: String::new(),
            planned_duration_secs: 0,
            started_at_ms: None,
            total_paused_ms: 0,
            pause_started_at_ms: None,
        }
    }

    pub fn start(
        &mut self,
        mission: String,
        victory: String,
        planned_secs: u64,
        now_ms: i64,
    ) -> Result<(), SessionError> {
        if !matches!(self.phase, Phase::Idle | Phase::Complete) {
            return Err(SessionError::InvalidTransition);
        }
        self.phase = Phase::Focusing;
        self.mission_title = mission;
        self.victory_condition = victory;
        self.planned_duration_secs = planned_secs;
        self.started_at_ms = Some(now_ms);
        self.total_paused_ms = 0;
        self.pause_started_at_ms = None;
        Ok(())
    }

    pub fn pause(&mut self, now_ms: i64) -> Result<(), SessionError> {
        if self.phase != Phase::Focusing {
            return Err(SessionError::InvalidTransition);
        }
        self.phase = Phase::Paused;
        self.pause_started_at_ms = Some(now_ms);
        Ok(())
    }

    pub fn resume(&mut self, now_ms: i64) -> Result<(), SessionError> {
        let Some(paused_at) = self.pause_started_at_ms else {
            return Err(SessionError::InvalidTransition);
        };
        if self.phase != Phase::Paused {
            return Err(SessionError::InvalidTransition);
        }
        self.total_paused_ms += now_ms - paused_at;
        self.pause_started_at_ms = None;
        self.phase = Phase::Focusing;
        Ok(())
    }

    pub fn complete(&mut self, _now_ms: i64) -> Result<(), SessionError> {
        if !matches!(self.phase, Phase::Focusing | Phase::Paused) {
            return Err(SessionError::InvalidTransition);
        }
        self.phase = Phase::Complete;
        self.pause_started_at_ms = None;
        Ok(())
    }

    pub fn reset(&mut self) {
        *self = SessionState::idle();
    }

    pub fn remaining_secs(&self, now_ms: i64) -> u64 {
        let Some(started) = self.started_at_ms else {
            return self.planned_duration_secs;
        };
        let live_pause = match self.pause_started_at_ms {
            Some(p) => now_ms - p,
            None => 0,
        };
        let paused = self.total_paused_ms + live_pause;
        let elapsed_ms = (now_ms - started - paused).max(0);
        let elapsed_secs = (elapsed_ms / 1000) as u64;
        self.planned_duration_secs.saturating_sub(elapsed_secs)
    }

    pub fn snapshot(&self, now_ms: i64) -> SessionSnapshot {
        SessionSnapshot {
            phase: self.phase,
            mission_title: self.mission_title.clone(),
            victory_condition: self.victory_condition.clone(),
            planned_duration_secs: self.planned_duration_secs,
            started_at_ms: self.started_at_ms,
            total_paused_ms: self.total_paused_ms,
            pause_started_at_ms: self.pause_started_at_ms,
            remaining_secs: self.remaining_secs(now_ms),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn start_from_idle_enters_focusing_and_stamps_start() {
        let mut s = SessionState::idle();
        s.start("Ship slice".into(), String::new(), 1500, 1_000)
            .unwrap();
        assert_eq!(s.phase, Phase::Focusing);
        assert_eq!(s.started_at_ms, Some(1_000));
        assert_eq!(s.remaining_secs(1_000), 1500);
        assert_eq!(s.remaining_secs(61_000), 1440); // 60s elapsed
    }

    #[test]
    fn start_rejected_unless_idle_or_complete() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        assert!(matches!(
            s.start("b".into(), String::new(), 1500, 5),
            Err(SessionError::InvalidTransition)
        ));
    }

    #[test]
    fn pause_then_resume_excludes_paused_time_from_elapsed() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        s.pause(60_000).unwrap(); // 60s focused
        assert_eq!(s.phase, Phase::Paused);
        s.resume(120_000).unwrap(); // paused 60s
        assert_eq!(s.total_paused_ms, 60_000);
        // 180s wall - 60s paused = 120s focused -> 1500 - 120 = 1380
        assert_eq!(s.remaining_secs(180_000), 1380);
    }

    #[test]
    fn pause_rejected_when_not_focusing() {
        let mut s = SessionState::idle();
        assert!(matches!(s.pause(1), Err(SessionError::InvalidTransition)));
    }

    #[test]
    fn complete_is_idempotent() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        s.complete(10_000).unwrap();
        assert_eq!(s.phase, Phase::Complete);
        assert!(matches!(
            s.complete(11_000),
            Err(SessionError::InvalidTransition)
        ));
    }

    #[test]
    fn remaining_never_underflows_past_zero() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 60, 0).unwrap();
        assert_eq!(s.remaining_secs(999_000), 0);
    }
}
