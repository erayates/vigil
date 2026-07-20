/// A rectangular monitor work area in physical pixels.
#[derive(Clone, Copy, Debug)]
pub struct WorkArea {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// The strip along the top of the companion that the user drags it by.
const GRAB_STRIP_HEIGHT: i32 = 28;
/// How much of that strip has to be on a monitor before it counts as grabbable.
const GRAB_STRIP_MIN_WIDTH: i32 = 96;

/// Keep a window reachable across display changes. "Reachable" means enough of
/// the drag strip is on some monitor to grab — a window whose body is visible
/// but whose handle sits above the screen edge cannot be moved back, so it
/// counts as lost. A lost window is relocated to the top-left of the primary
/// (first) work area; anything grabbable is left exactly where the user put it.
pub fn clamp_to_work_areas(
    x: i32,
    y: i32,
    width: i32,
    // Height plays no part: only the top strip decides reachability.
    _height: i32,
    areas: &[WorkArea],
) -> (i32, i32) {
    let needed = GRAB_STRIP_MIN_WIDTH.min(width);
    let grabbable = areas.iter().any(|a| {
        let overlap_x = (x + width).min(a.x + a.width) - x.max(a.x);
        let overlap_y = (y + GRAB_STRIP_HEIGHT).min(a.y + a.height) - y.max(a.y);
        overlap_x >= needed && overlap_y > 0
    });
    if grabbable {
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
        // Half off the right edge: 120px of the strip remains, still grabbable.
        assert_eq!(
            clamp_to_work_areas(1800, 100, 240, 360, &[primary()]),
            (1800, 100)
        );
    }

    #[test]
    fn rescues_a_window_with_only_a_sliver_on_screen() {
        // 20px poking in from the right is not enough of the strip to grab.
        assert_eq!(
            clamp_to_work_areas(1900, 100, 240, 360, &[primary()]),
            (0, 0)
        );
    }

    #[test]
    fn rescues_a_window_whose_handle_sits_above_the_screen() {
        // The body is plainly visible, but the strip the user drags is not.
        assert_eq!(
            clamp_to_work_areas(400, -40, 240, 360, &[primary()]),
            (0, 0)
        );
    }

    #[test]
    fn keeps_a_window_on_a_secondary_monitor() {
        let areas = [
            primary(),
            WorkArea {
                x: 1920,
                y: -200,
                width: 2560,
                height: 1440,
            },
        ];
        assert_eq!(
            clamp_to_work_areas(3000, -100, 240, 360, &areas),
            (3000, -100)
        );
    }

    #[test]
    fn rescues_a_window_after_the_secondary_monitor_shrinks() {
        // The second display dropped from 2560 to 1280 wide; x=3400 is now void.
        let areas = [
            primary(),
            WorkArea {
                x: 1920,
                y: 0,
                width: 1280,
                height: 1024,
            },
        ];
        assert_eq!(clamp_to_work_areas(3400, 100, 240, 360, &areas), (0, 0));
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
