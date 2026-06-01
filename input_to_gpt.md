What the project is doing

Root package.json sets Electron Forge entry to index.js.
package.json is a separate Node backend manifest, but the packaged Electron app is driven by the root Forge config.
forge.config.js uses asar.unpack: 'backend/**/*', includes src, backend, and package.json, and does not define extraResources, extraResource, or asarUnpack.
Main process and backend launch
The backend is started in src/index.js with spawn(...):
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

serverProcess = spawn(nodePath, [backendPath], {
  cwd: backendCwd,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1'
  }
});
The main window loads:
mainWindow.loadURL('http://127.0.0.1:5000/login.html');
The startup wait/health check is:
await checkServerHealth();

setTimeout(() => {
  createMainWindow();
}, 1000);
and the health check itself polls:
http.get('http://127.0.0.1:5000/api/health', ...)
The backend server listens on port 5000 in backend/server.js:
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`   >>> Server running on: http://localhost:${PORT}`);
});

Folder layout

d:\sudhan_desktop
- forge.config.js
- package.json
- backend/
  - package.json
  - server.js
  - firebase.js
  - public/
- src/
  - index.js
  - preload.js
  - splash.html
  - index.html
  - logo.png
- resources/
  - not present in the workspace; created only after packaging

Where backend files end up after packaging
Because backend/**/* is unpacked, the packaged app should place backend files under something like:

resources/app.asar for the main app bundle
resources/app.asar.unpacked/backend/... for unpacked backend files
Most likely cause of ERR_CONNECTION_REFUSED
The backend path is resolved with app.getAppPath() in packaged builds, which points at the app bundle, not the unpacked backend folder. So the child process is likely trying to execute server.js from the wrong location, and the app still loads http://127.0.0.1:5000/login.html after the health check timeout.

There is also a second risk: the code prefers a system node executable first. If that path is used in a packaged build, module resolution can break because the app dependencies are bundled for Electron, not for a standalone Node runtime.

If you want, I can now fix the packaged backend path and startup runtime in src/index.js.