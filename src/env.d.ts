/// <reference types="vite/client" />

/**
 * Global constants injected by Vite at build time from package.json.
 * Defined in vite.config.ts → define: { __APP_VERSION__ }
 */
declare const __APP_VERSION__: string

/**
 * Electron API exposed via contextBridge in electron/preload.js.
 * Only available when running inside the Electron shell.
 */
interface Window {
  electron?: {
    updater: {
      onUpdateAvailable: (callback: (info: { version: string }) => void) => void
      onDownloadProgress: (callback: (percent: number) => void) => void
      onUpdateReady: (callback: (info: { version: string }) => void) => void
      installUpdate: () => void
    }
  }
}
