const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getUserSourcesPath() {
  return path.join(app.getPath('userData'), 'sources.json');
}

function getUserAddonsPath() {
  return path.join(app.getPath('userData'), 'addons.json');
}

function getSeedSources() {
  const seedPath = path.join(__dirname, 'sources.json');
  try {
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading seed sources.json:', err);
  }
  return [];
}

function getSeedAddons() {
  const seedPath = path.join(__dirname, 'addons.json');
  try {
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading seed addons.json:', err);
  }
  return [];
}

function loadSources() {
  const userPath = getUserSourcesPath();
  try {
    if (fs.existsSync(userPath)) {
      const data = fs.readFileSync(userPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read user sources, falling back to seed:', err);
  }

  // Fallback to seed sources and initialize user file
  const seed = getSeedSources();
  try {
    fs.mkdirSync(path.dirname(userPath), { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(seed, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to copy seed sources to user directory:', err);
  }
  return seed;
}

function saveSources(sources) {
  const userPath = getUserSourcesPath();
  try {
    fs.mkdirSync(path.dirname(userPath), { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(sources, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Failed to save sources:', err);
    return { success: false, error: err.message };
  }
}

function loadAddons() {
  const userPath = getUserAddonsPath();
  try {
    if (fs.existsSync(userPath)) {
      const data = fs.readFileSync(userPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read user addons, falling back to seed:', err);
  }

  const seed = getSeedAddons();
  try {
    fs.mkdirSync(path.dirname(userPath), { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(seed, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to copy seed addons to user directory:', err);
  }
  return seed;
}

function saveAddons(addons) {
  const userPath = getUserAddonsPath();
  try {
    fs.mkdirSync(path.dirname(userPath), { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(addons, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Failed to save addons:', err);
    return { success: false, error: err.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: undefined
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximizedChange', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximizedChange', false);
  });
}

app.whenReady().then(() => {
  // IPC Handlers
  ipcMain.handle('sources:get', async () => {
    return loadSources();
  });

  ipcMain.handle('sources:save', async (event, sources) => {
    return saveSources(sources);
  });

  ipcMain.handle('sources:reset', async () => {
    const seed = getSeedSources();
    saveSources(seed);
    return seed;
  });

  ipcMain.handle('sources:importDialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Quellen-JSON importieren / Forrás JSON importálása',
      filters: [{ name: 'JSON Feed', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return { success: true, sources: parsed };
      } else {
        return { success: false, error: 'JSON muss ein Array von Quellen sein / A JSON-nak források listáját kell tartalmaznia.' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sources:exportDialog', async (event, sources) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Quellen-JSON exportieren / Források exportálása',
      defaultPath: 'sources.json',
      filters: [{ name: 'JSON Feed', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    try {
      fs.writeFileSync(result.filePath, JSON.stringify(sources, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Export failed:', err);
      return false;
    }
  });

  // Addons Handlers
  ipcMain.handle('addons:get', async () => {
    return loadAddons();
  });

  ipcMain.handle('addons:save', async (event, addons) => {
    return saveAddons(addons);
  });

  ipcMain.handle('addons:reset', async () => {
    const seed = getSeedAddons();
    saveAddons(seed);
    return seed;
  });

  ipcMain.handle('addons:fetchRemote', async (event, url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 PrimeNexus/2.0',
          'Accept': '*/*'
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const text = await res.text();
      return { success: true, text };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Window Controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
