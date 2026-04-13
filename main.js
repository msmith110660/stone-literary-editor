const { app, BrowserWindow } = require('electron');
const { app: server, PORT } = require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 860,
    autoHideMenuBar: true,
    title: 'Stone Literary LLC Editor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// Start Express, then open the window once it's listening
app.whenReady().then(() => {
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
