const { app, BrowserWindow, nativeImage } = require('electron');
const { app: server } = require('./server.js');
const { execSync } = require('child_process');
const path = require('path');

const PORT = 3000;
let mainWindow;

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

  mainWindow.loadURL(`http://localhost:${PORT}`);
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
