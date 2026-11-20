const { app, BrowserWindow, nativeImage, shell } = require('electron');
const { app: server } = require('./server.js');
const { execSync } = require('child_process');
const path = require('path');

const PORT = 3000;
const APP_NAME = 'Stone Literary LLC Editor';
let mainWindow;

// Keep saved settings (including the API key) in a folder named after the app,
// which is the folder the uninstaller removes. Running from source (npm start)
// uses a separate "(Dev)" folder so a key saved while developing never shows up
// in the installed app.
app.setName(APP_NAME);
app.setPath('userData', path.join(
  app.getPath('appData'),
  app.isPackaged ? APP_NAME : `${APP_NAME} (Dev)`
));

// Enforce single instance — if a second copy launches, focus the existing window
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Kill whatever process is holding the port, then take it
function forcePort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`).toString();
    const pids = new Set();
    for (const line of result.trim().split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try { execSync(`taskkill /PID ${pid} /F`); } catch {}
    }
    // Brief pause to let the OS release the port
    if (pids.size > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  } catch {
    // Port was already free — nothing to do
  }
}

function createWindow() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.ico'));
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 860,
    autoHideMenuBar: true,
    title: 'Stone Literary LLC Editor',
    icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Open web links (e.g. the Anthropic console) in the user's normal browser,
  // not in a new app window
  const appOrigin = `http://localhost:${PORT}`;
  const openExternally = (url) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  };
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appOrigin)) {
      event.preventDefault();
      openExternally(url);
    }
  });

  mainWindow.loadURL(appOrigin);
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  if (!gotLock) return;
  forcePort(PORT);
  server.listen(PORT, () => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
