/// A rectangular monitor work area in physical pixels.
#[derive(Clone, Copy, Debug)]
pub struct WorkArea {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Keep a window reachable across display changes. If the window rectangle does
/// not intersect any work area (it is off-screen — e.g. a monitor was unplugged),
/// relocate it to the top-left of the primary (first) work area. Otherwise leave
/// it where it is.
pub fn clamp_to_work_areas(
    x: i32,
    y: i32,
    width: i32,
    height: i32,
    areas: &[WorkArea],
) -> (i32, i32) {
    let visible = areas
        .iter()
        .any(|a| x < a.x + a.width && x + width > a.x && y < a.y + a.height && y + height > a.y);
    if visible {
        return (x, y);
    }
    match areas.first() {
        Some(a) => (a.x, a.y),
        None => (x, y),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn primary() -> WorkArea {
        WorkArea {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
        }
    }

    #[test]
    fn keeps_a_window_that_is_on_screen() {
        assert_eq!(
            clamp_to_work_areas(100, 100, 240, 360, &[primary()]),
            (100, 100)
        );
    }

    #[test]
    fn relocates_a_window_left_on_a_removed_monitor() {
        // Companion was at x=2200 on a second monitor that is now gone.
        assert_eq!(
            clamp_to_work_areas(2200, 300, 240, 360, &[primary()]),
            (0, 0)
        );
    }

    #[test]
    fn keeps_a_window_that_partially_overlaps_an_edge() {
        // Half off the right edge is still reachable.
        assert_eq!(
            clamp_to_work_areas(1800, 100, 240, 360, &[primary()]),
            (1800, 100)
        );
    }

    #[test]
    fn no_monitors_leaves_the_position_unchanged() {
        assert_eq!(clamp_to_work_areas(2200, 300, 240, 360, &[]), (2200, 300));
    }

    #[test]
    fn picks_the_primary_area_when_off_all_monitors() {
        let areas = [
            primary(),
            WorkArea {
                x: 1920,
                y: 0,
                width: 1920,
                height: 1080,
            },
        ];
        assert_eq!(clamp_to_work_areas(500, 5000, 240, 360, &areas), (0, 0));
    }
}
