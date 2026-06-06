import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import log from 'electron-log'
import pkg from 'electron-updater'
const { autoUpdater } = pkg

// Configure updater logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
// Allow pre-release channels (electron-builder publishes as pre-release by default)
autoUpdater.allowPrerelease = true
// Auto-download updates silently in background
autoUpdater.autoDownload = true
// Check for updates every 4 hours
setInterval(() => {
  if (!process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Failed to check for updates:', err)
    })
  }
}, 4 * 60 * 60 * 1000)
log.info('App starting...')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Keep a global reference to the window so we can send IPC messages to it
let mainWindow = null

function createWindow() {
  const isDev = !!process.env.VITE_DEV_SERVER_URL
  
  // During dev, icon is in public. In production, Vite copies it to dist.
  const iconPath = isDev 
    ? path.join(__dirname, '../public/icon-512.png')
    : path.join(__dirname, '../dist/icon-512.png')

  // On Mac, force the Dock icon during development mode
  if (process.platform === 'darwin' && fs.existsSync(iconPath)) {
    app.dock.setIcon(iconPath)
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: iconPath,
    titleBarStyle: 'hiddenInset', // Keeps the frameless design on Mac
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Hide the default menu bar for a cleaner "app" feel
  mainWindow.setMenuBarVisibility(false)
  mainWindow.autoHideMenuBar = true

  if (isDev) {
    // Development mode
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    
    // If the main page fails to load, show an error screen
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return // Ignore missing background images, favicons, or service workers
      log.error('Main page failed to load:', errorCode, errorDescription, validatedURL)
      mainWindow.webContents.loadURL(`data:text/html,<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff"><h2>⚠️ App Failed to Load</h2><p>${errorDescription}</p><p style="color:#aaa;font-size:13px">Error code: ${errorCode}</p></body></html>`)
    })

    // Catch renderer JS crashes and show a friendly dialog
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      log.error('Renderer process gone:', details)
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Acadera Crashed',
        message: 'The app encountered an unexpected error and needs to restart.',
        detail: `Reason: ${details.reason}`,
        buttons: ['Restart', 'Quit']
      }).then(({ response }) => {
        if (response === 0) {
          app.relaunch()
          app.exit(0)
        } else {
          app.quit()
        }
      })
    })

    mainWindow.webContents.on('console-message', (event, level, message) => {
      if (level >= 2) log.error('[Renderer]', message) // 2=warning, 3=error
      else log.info('[Renderer]', message)
    })
  }
}

// ── IPC: Renderer asks to install the ready update ────────────────────────────
ipcMain.on('install-update', () => {
  log.info('User triggered update install')
  autoUpdater.quitAndInstall()
})

// ── Updater Events ─────────────────────────────────────────────────────────────
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version)
  // Silently notify the UI — NO native OS dialog popup
  if (mainWindow) {
    mainWindow.webContents.send('update-available', { version: info.version })
  }
})

autoUpdater.on('update-not-available', () => {
  log.info('No update available')
})

autoUpdater.on('download-progress', (progress) => {
  const percent = Math.round(progress.percent)
  log.info(`Download progress: ${percent}%`)
  // Push progress to the UI banner
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', percent)
  }
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version)
  // Notify the UI that the update is ready to install — NO native OS dialog
  if (mainWindow) {
    mainWindow.webContents.send('update-ready', { version: info.version })
  }
})

autoUpdater.on('error', (err) => {
  log.error('Update error:', err)
})

app.whenReady().then(() => {
  createWindow()
  
  // Only check for updates in production
  if (!process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.error('Failed to check for updates:', err)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
