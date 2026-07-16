const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentVersion: () => ipcRenderer.invoke('get-app-version'),
  installUpdate: (updateDetails) => ipcRenderer.invoke('install-update', updateDetails),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
});
