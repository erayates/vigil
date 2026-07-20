# Where VIGIL keeps your data, and what installers do to it

Everything VIGIL knows about you lives in two folders on your own machine.
Nothing is ever sent anywhere.

## Locations (Windows)

| What | Path |
| --- | --- |
| Your data — missions, watches, debriefs, campaigns, settings | `%APPDATA%\dev.erayates.vigil\vigil.db` |
| A data file VIGIL could not read, preserved for you | `%APPDATA%\dev.erayates.vigil\vigil.db.corrupt-<timestamp>` |
| Webview cache (safe to delete, regenerates) | `%LOCALAPPDATA%\dev.erayates.vigil\EBWebView` |
| The application itself | `%LOCALAPPDATA%\VIGIL` (NSIS) or `%PROGRAMFILES%\VIGIL` (MSI) |

`vigil.db` is a plain SQLite database. Copy it anywhere to take your history
with you; drop it back to restore. The in-app export in the campaign board
writes the same content as JSON, which is the portable option — see
[backup-format.md](backup-format.md).

## Install

Fresh install creates neither folder. They appear the first time VIGIL runs,
and `vigil.db` is created with the current schema.

## Upgrade

Both installers replace only the application files. Your data folder is not
touched, so watch history, campaigns, doctrine and companion preferences all
survive an upgrade.

The database is migrated forward on first launch of the new version. Migrations
are forward-only and keyed on the schema version stored in the file, so running
a new build against an old file upgrades it once, and running it again does
nothing. Every migration step is tested against rows written before it, so an
upgrade cannot silently drop records.

Downgrading is not supported: an older build opening a newer file will refuse
rather than damage it. Keep an export before trying one.

## Uninstall

**Neither installer deletes your data unless you ask it to.**

- **NSIS (`VIGIL_x.y.z_x64-setup.exe`)** — the uninstall confirmation page shows
  a *"Delete the application data"* checkbox. It is **unchecked by default**.
  Leave it alone and `%APPDATA%\dev.erayates.vigil` stays exactly where it is.
  Tick it and both the roaming and local folders are removed. The checkbox is
  also ignored entirely during an upgrade, so an in-place update can never take
  your history with it.
- **MSI (`VIGIL_x.y.z_x64_en-US.msi`)** — removes the installed files, the
  shortcuts and its registry keys. It has no data-deletion path at all; your
  data folder is left behind whatever you do.

To remove your data by hand after uninstalling, delete
`%APPDATA%\dev.erayates.vigil`. That is the whole of it.

## What is never touched

- No data leaves the machine, at install time or after.
- No registry keys hold your content; the registry is used only for install
  location, language and the optional launch-at-login entry.
- The launch-at-login entry (`HKCU\...\CurrentVersion\Run`) is removed on
  uninstall, so an uninstalled VIGIL cannot start itself.
