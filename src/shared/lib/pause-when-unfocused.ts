/**
 * WebView2 keeps painting a window that is minimised or buried behind other
 * apps, so a decorative CSS animation costs real CPU all day. Measured at 10%
 * of one core while idle — see docs/quality/idle-resource-budget.md.
 *
 * Marking the document while it is unfocused lets CSS park those animations.
 * Only the main window uses this: the companion is glanceable precisely when
 * it is not focused, so it must keep moving.
 */
export function pauseAnimationsWhenUnfocused(): void {
  const sync = () => {
    document.documentElement.classList.toggle('is-window-unfocused', !document.hasFocus());
  };
  window.addEventListener('focus', sync);
  window.addEventListener('blur', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
