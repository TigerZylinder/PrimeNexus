const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('sources:get'),
  saveSources: (sources) => ipcRenderer.invoke('sources:save', sources),
  resetSources: () => ipcRenderer.invoke('sources:reset'),
  importSourcesDialog: () => ipcRenderer.invoke('sources:importDialog'),
  exportSourcesDialog: (sources) => ipcRenderer.invoke('sources:exportDialog', sources),
  
  // Add-ons & Remote Library Feeds
  getAddons: () => ipcRenderer.invoke('addons:get'),
  saveAddons: (addons) => ipcRenderer.invoke('addons:save', addons),
  resetAddons: () => ipcRenderer.invoke('addons:reset'),
  fetchRemote: (url) => ipcRenderer.invoke('addons:fetchRemote', url),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('window:maximizedChange', (event, isMax) => callback(isMax));
  }
});
