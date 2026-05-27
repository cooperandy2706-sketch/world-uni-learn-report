import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import log from 'electron-log'
import pkg from 'electron-updater'
const { autoUpdater } = pkg

// Configure updater logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  const win = new BrowserWindow({
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
  win.setMenuBarVisibility(false)
  win.autoHideMenuBar = true

  if (isDev) {
    // Development mode
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // Production mode
    win.loadFile(path.join(__dirname, '../dist/index.html'))
    
    // If the main page fails to load, show an error screen
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return // Ignore missing background images, favicons, or service workers
      log.error('Main page failed to load:', errorCode, errorDescription, validatedURL)
      win.webContents.loadURL(`data:text/html,<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff"><h2>⚠️ App Failed to Load</h2><p>${errorDescription}</p><p style="color:#aaa;font-size:13px">Error code: ${errorCode}</p></body></html>`)
    })

    // Catch renderer JS crashes and show DevTools
    win.webContents.on('render-process-gone', (event, details) => {
      log.error('Renderer process gone:', details)
      win.webContents.openDevTools()
    })

    win.webContents.on('console-message', (event, level, message) => {
      if (level >= 2) log.error('[Renderer]', message) // 2=warning, 3=error
      else log.info('[Renderer]', message)
    })
  }
}

// Updater Events
autoUpdater.on('update-available', () => {
  log.info('Update available.')
})

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded')
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version of Nexora has been downloaded. The app will automatically restart and install the update.',
    buttons: ['Restart Now']
  }).then(() => {
    autoUpdater.quitAndInstall()
  })
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
