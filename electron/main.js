import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

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
  } else {
    // Production mode
    win.loadFile(path.join(__dirname, '../dist/index.html'))
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
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
