const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

const fs = require('fs');

const logError = (msg) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'calculadora-error-log.txt');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);
  } catch (e) {}
};

process.on('uncaughtException', (err) => {
  logError(`Uncaught Exception: ${err.message}\n${err.stack}`);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 720,
    frame: false,  // Frameless for custom title bar
    transparent: true, // Allow rounded corners at the OS level
    backgroundColor: '#00000000', // Stay transparent here to allow CSS background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
    icon: path.join(__dirname, 'Calculadora.ico')
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    logError(`Fallo al cargar (did-fail-load): ${desc} (${code}) en ${url}`);
  });

  win.setMenu(null);

  // IPC Handlers
  ipcMain.on('window-close', () => {
    app.quit();
  });

  ipcMain.on('window-minimize', () => {
    win.minimize();
  });

  ipcMain.on('window-resize', (event, { width, height }) => {
    win.setMinimumSize(width, height);
    win.setSize(width, height, true);
    win.center();
  });

  let previousBounds = null;
  ipcMain.on('window-pip', () => {
    previousBounds = win.getBounds();
    win.setAlwaysOnTop(true, 'floating');
    win.setSize(320, 520, true);
  });

  ipcMain.on('window-restore', () => {
    win.setAlwaysOnTop(false);
    if (previousBounds) {
      win.setBounds(previousBounds, true);
    } else {
      win.setSize(520, 720, true);
    }
  });
}


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
