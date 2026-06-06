const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  updater: {
    /** Called when an update starts downloading in the background */
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', (_event, info) => callback(info))
    },
    /** Called with download progress (0-100) */
    onDownloadProgress: (callback) => {
      ipcRenderer.on('download-progress', (_event, percent) => callback(percent))
    },
    /** Called when the update is fully downloaded and ready to install */
    onUpdateReady: (callback) => {
      ipcRenderer.on('update-ready', (_event, info) => callback(info))
    },
    /** Trigger quit-and-install from the renderer */
    installUpdate: () => {
      ipcRenderer.send('install-update')
    },
  },
})
