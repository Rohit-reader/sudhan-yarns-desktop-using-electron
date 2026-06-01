const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let splashWindow;
let mainWindow;
let serverProcess;
let backendLogs = []; // Store backend logs to display if there's an error

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
      devTools: true,
    },
  });

  // Set background color to match the app
  mainWindow.setBackgroundColor('#f8fafc');

  // Try to load the backend server URL
  mainWindow.loadURL('http://127.0.0.1:5000/login.html');

  // Handle page load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ Failed to load page. Error ${errorCode}: ${errorDescription}`);
    console.error('Backend logs:', backendLogs.join('\n'));
    
    // Show an error page with backend logs
    const errorLogs = backendLogs.slice(-20).join('<br/>'); // Last 20 lines
    const errorHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .error-container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              max-width: 800px;
              text-align: center;
              max-height: 90vh;
              overflow-y: auto;
            }
            h1 { color: #d32f2f; margin-top: 0; }
            p { color: #666; line-height: 1.6; }
            .error-code { background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0; text-align: left; font-size: 14px; }
            .logs { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0; text-align: left; font-size: 12px; max-height: 300px; overflow-y: auto; }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
            button:hover { background: #764ba2; }
            .section { text-align: left; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Backend Server Failed to Start</h1>
            <p>The application backend server failed to start or respond on port 5000.</p>
            
            <div class="section">
              <h3>Error Details:</h3>
              <div class="error-code">Error ${errorCode}: ${errorDescription}</div>
            </div>
            
            ${errorLogs ? `
            <div class="section">
              <h3>Backend Output (Last 20 lines):</h3>
              <div class="logs">${errorLogs}</div>
            </div>
            ` : ''}
            
            <div class="section">
              <h3>Troubleshooting:</h3>
              <ol>
                <li>Check if port 5000 is already in use: <code>netstat -ano | findstr :5000</code></li>
                <li>Verify backend dependencies: <code>cd backend && npm install</code></li>
                <li>Check Firebase credentials in <code>backend/firebase.js</code></li>
                <li>Try again by clicking the Retry button</li>
              </ol>
            </div>
            
            <button onclick="location.reload()">Retry</button>
          </div>
          <script>
            console.log('Backend logs:', \`${errorLogs}\`);
          </script>
        </body>
      </html>
    `;
    
    const errorHtmlPath = path.join(app.getPath('userData'), 'error.html');
    try {
      fs.writeFileSync(errorHtmlPath, errorHTML, 'utf-8');
      mainWindow.loadFile(errorHtmlPath);
    } catch (e) {
      console.error('Failed to write error page to disk:', e);
      mainWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.maximize();
    mainWindow.show();
    
    // Open DevTools in development for debugging
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));
};

const startBackend = () => {
  // Resolve backend path - backend is unpacked from asar in packaged builds
  let backendPath;
  let backendCwd;
  
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    backendPath = path.join(appPath, 'backend', 'server.js');
    backendCwd = path.join(appPath, 'backend');
  } else {
    backendPath = path.join(__dirname, '..', 'backend', 'server.js');
    backendCwd = path.join(__dirname, '..', 'backend');
  }

  console.log('🚀 Starting backend server...');
  console.log(`   Backend path: ${backendPath}`);
  console.log(`   Backend CWD: ${backendCwd}`);
  console.log(`   Is Packaged: ${app.isPackaged}`);
  
  // Verify backend files exist
  try {
    if (!fs.existsSync(backendPath)) {
      throw new Error(`Backend server.js not found at: ${backendPath}`);
    }
    if (!fs.existsSync(backendCwd)) {
      throw new Error(`Backend directory not found at: ${backendCwd}`);
    }
    console.log('✅ Backend files verified');
  } catch (err) {
    console.error('❌ Backend file check failed:', err.message);
    backendLogs.push(`ERROR: ${err.message}`);
    return;
  }

  // Find Node.js executable
  let nodePath = null;
  try {
    const { execSync } = require('child_process');
    
    // First try: Use system node via PowerShell (Get-Command)
    try {
      const result = execSync('powershell -NoProfile -Command "Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000
      }).toString().trim();
      
      if (result && result.length > 0) {
        const pathCheck = result.split('\n')[0].trim();
        if (fs.existsSync(pathCheck)) {
          nodePath = pathCheck;
          console.log(`✅ Found system Node.js via PowerShell: ${nodePath}`);
          backendLogs.push(`Found system Node.js via PowerShell: ${nodePath}`);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not find node via PowerShell');
    }
    
    // Second try: Use cmd.exe to find node
    if (!nodePath) {
      try {
        const result = execSync('cmd /c where node', { 
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
          timeout: 5000
        }).toString().trim();
        
        if (result) {
          const pathCheck = result.split('\n')[0].trim();
          if (fs.existsSync(pathCheck)) {
            nodePath = pathCheck;
            console.log(`✅ Found system Node.js via cmd: ${nodePath}`);
            backendLogs.push(`Found system Node.js via cmd: ${nodePath}`);
          }
        }
      } catch (e) {
        console.log('⚠️ Could not find node via cmd where');
      }
    }
    
    // Third try: Try common paths and PATH environment variable
    if (!nodePath) {
      const commonPaths = [
        'D:\\nvmnode\\nodejs\\node.exe',
        'D:\\nodejs\\node.exe',
        'C:\\Program Files\\nodejs\\node.exe',
        'C:\\Program Files (x86)\\nodejs\\node.exe',
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'nvm', 'nodejs', 'node.exe'),
      ];
      
      // Add paths from PATH environment variable
      if (process.env.PATH) {
        const pathDirs = process.env.PATH.split(';');
        for (const dir of pathDirs) {
          commonPaths.push(path.join(dir, 'node.exe'));
        }
      }
      
      for (const checkPath of commonPaths) {
        if (fs.existsSync(checkPath)) {
          nodePath = checkPath;
          console.log(`✅ Found Node.js at: ${nodePath}`);
          backendLogs.push(`Found Node.js at: ${nodePath}`);
          break;
        }
      }
    }
    
    // Fourth try / Fallback: Use the Electron process executable (which works, but might have firewall blocks)
    if (!nodePath) {
      try {
        nodePath = process.execPath;
        if (fs.existsSync(nodePath)) {
          console.log(`✅ Using Electron's Node.js as fallback: ${nodePath}`);
          backendLogs.push(`Using Electron's Node.js as fallback: ${nodePath}`);
        } else {
          nodePath = null;
        }
      } catch (e) {
        console.log('⚠️ Could not use process.execPath');
      }
    }
    
    if (!nodePath) {
      throw new Error('Node.js executable not found in any known location');
    }
  } catch (err) {
    console.error('❌ Error finding Node.js:', err.message);
    backendLogs.push(`ERROR finding Node.js: ${err.message}`);
  }

  if (!nodePath) {
    console.error('❌ Failed to find Node.js executable');
    backendLogs.push('FATAL: Node.js executable not found');
    return;
  }

  // Cleanup port 5000 specifically to avoid address-in-use errors
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      try {
        const stdout = execSync('netstat -ano | findstr :5000', { encoding: 'utf-8' }).toString();
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4 && (parts[1].endsWith(':5000') || parts[1] === '[::]:5000')) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid) && parseInt(pid) > 0) {
              try {
                execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
                console.log(`🛡️ Terminated orphan backend process (PID: ${pid})`);
                backendLogs.push(`Killed process on port 5000 (PID: ${pid})`);
              } catch (err) {}
            }
          }
        });
      } catch (e) {
        // Port not currently in use
      }
    }
  } catch (e) {
    console.log('Port cleanup skipped');
  }

  // Start backend
  try {
    console.log(`📍 Spawning: "${nodePath}" "${backendPath}"`);
    serverProcess = spawn(nodePath, [backendPath], {
      cwd: backendCwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'
      },
      shell: false
    });

    if (!serverProcess) {
      throw new Error('Failed to spawn server process');
    }

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[Backend]: ${message}`);
        backendLogs.push(`[LOG] ${message}`);
        if (backendLogs.length > 100) {
          backendLogs.shift();
        }
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.error(`[Backend Error]: ${message}`);
        backendLogs.push(`[ERROR] ${message}`);
        if (backendLogs.length > 100) {
          backendLogs.shift();
        }
      }
    });

    serverProcess.on('error', (err) => {
      const msg = `Failed to spawn backend: ${err.message}`;
      console.error('❌ ' + msg);
      backendLogs.push(`SPAWN ERROR: ${msg}`);
    });

    serverProcess.on('close', (code, signal) => {
      const msg = `Backend process exited with code ${code}, signal ${signal}`;
      console.log(msg);
      backendLogs.push(`CLOSE: ${msg}`);
    });
    
    console.log(`✅ Backend spawned with PID: ${serverProcess.pid}`);
    backendLogs.push(`✅ Backend spawned with PID: ${serverProcess.pid}`);
  } catch (err) {
    console.error('❌ Error spawning backend:', err.message);
    console.error('Stack:', err.stack);
    backendLogs.push(`FATAL ERROR: ${err.message}`);
    backendLogs.push(err.stack);
  }
};

const checkServerHealth = () => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 10; // 10 seconds max

    const poll = () => {
      attempts++;
      if (attempts > maxAttempts) {
        console.warn('⚠️ Server health check timed out after 10 seconds. App may not work correctly.');
        return resolve(false);
      }

      http.get('http://127.0.0.1:5000/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is healthy.');
          resolve(true);
        } else {
          console.log(`   Health check attempt ${attempts}/${maxAttempts}...`);
          setTimeout(poll, 1000);
        }
      }).on('error', () => {
        console.log(`   Health check attempt ${attempts}/${maxAttempts}...`);
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
