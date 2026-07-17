import { invoke } from '@tauri-apps/api/core';

function isTauriRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

async function invokeSafely(command: string, args?: Record<string, unknown>): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    await invoke(command, args);
  } catch (error) {
    console.error(`[nativeBridge] ${command} failed`, error);
  }
}

export const nativeBridge = {
  showCompanion: () => invokeSafely('show_companion'),
  hideCompanion: () => invokeSafely('hide_companion'),
  setCompanionClickThrough: (enabled: boolean) =>
    invokeSafely('set_companion_click_through', { enabled }),
  minimizeMain: () => invokeSafely('minimize_main'),
  toggleMaximizeMain: () => invokeSafely('toggle_maximize_main'),
  closeMain: () => invokeSafely('close_main'),
};
