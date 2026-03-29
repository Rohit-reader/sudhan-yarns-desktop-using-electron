const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let splashWindow;
let mainWindow;
let serverProcess;

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => (splashWindow = null));
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set background color to match the app
  mainWindow.setBackgroundColor('#f8fafc');

  // Load the backend server URL
  mainWindow.loadURL('http://localhost:5000/login.html');

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.maximize();
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => (mainWindow = null));
};

const startBackend = () => {
  const backendPath = path.join(process.cwd(), 'backend', 'server.js');
  
  // Cleanup port 5000 specifically to avoid address-in-use errors
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      // Find PID using port 5000 and kill it
      const stdout = execSync('netstat -ano | findstr :5000').toString();
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        // Ensure we're targeting a process listening on port 5000
        if (parts.length > 4 && (parts[1].endsWith(':5000') || parts[1] === '[::]:5000')) {
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && parseInt(pid) > 0) {
            try {
              execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
              console.log(`🛡️ Terminated orphan backend process (PID: ${pid})`);
            } catch (err) {}
          }
        }
      });
    }
  } catch (e) {
    // Port not in use or error finding PID
  }

  // Launch server.js using node
  // No shell: true used to avoid escaping/concatenation warnings
  serverProcess = spawn('node', [backendPath], {
    cwd: path.join(process.cwd(), 'backend'),
    stdio: 'inherit' 
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  // Final catch-all for app close
  serverProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
};

const checkServerHealth = () => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 5; // 5 seconds max

    const poll = () => {
      attempts++;
      if (attempts > maxAttempts) {
        console.warn('⚠️ Server health check timed out. Proceeding anyway.');
        return resolve(true);
      }

      http.get('http://localhost:5000/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is healthy.');
          resolve(true);
        } else {
          setTimeout(poll, 1000);
        }
      }).on('error', () => {
        setTimeout(poll, 1000);
      });
    };
    poll();
  });
};

app.whenReady().then(async () => {
  createSplashWindow();
  startBackend();

  // Wait for server to be ready before showing main window
  await checkServerHealth();
  
  // Brief delay to ensure splash screen interaction feels smooth
  setTimeout(() => {
    createMainWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill backend process when app closes
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
