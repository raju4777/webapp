const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

// Start Node.js server on app launch
app.on('ready', () => {
    exec('node server.js', (error) => {
        if (error) {
            console.error('Failed to start server:', error);
            app.quit();
            return;
        }
    });

    // Create the Electron window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Recommended for security
        },
    });

    // Load the server's URL
    mainWindow.loadURL('http://localhost:4000');
});

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
