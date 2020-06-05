import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import * as windowState from 'electron-window-state';
import * as Datastore from 'nedb';

const db = new Datastore({
  filename: path.join(app.getPath('userData'), 'envelope.db'),
  autoload: true,
  corruptAlertThreshold: 0
});

const createWindow = () => {
  let mainWindowState = windowState({
    defaultWidth: 1100,
    defaultHeight: 1000
  });

  // Create the browser window.
  const win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindowState.manage(win);

  // and load the index.html of the app.
  win.loadFile(path.resolve(__dirname, 'html', 'index.html'));

  // Open the DevTools.
  win.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
