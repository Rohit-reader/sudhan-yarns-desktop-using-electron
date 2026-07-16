# Implementation Plan - Check for Updates via GitHub Releases

We will add a secure, user-authorized "Check for Updates" feature to the desktop app. It will query the GitHub Releases API for the latest release in the repository `Rohit-reader/sudhan-yarns-desktop-using-electron`, parse the version details and release notes, find the `.exe` installer asset, and download/run it upon explicit user approval with an animated progress bar.

---

## User Review Required

> [!IMPORTANT]
> - **No Auto-Updates**: The update will only download and execute when the user explicitly clicks the "Update Now" button.
> - **GitHub Repository**: The app will target the `Rohit-reader/sudhan-yarns-desktop-using-electron` repository. If no release exists yet on GitHub, it will handle it gracefully and show a "No updates found" message.

---

## Proposed Changes

### 1. IPC Bridge Configuration

#### [MODIFY] [preload.js](file:///d:/sudhan_desktop/src/preload.js)
- Add context bridge mappings to securely communicate between the HTML page and the Electron main process:
  - `getCurrentVersion()`: Retrieves the local Electron version (read from `package.json`).
  - `installUpdate({ downloadUrl })`: Downloads the installer from GitHub, sends progress events, and launches the update.
  - `onDownloadProgress(callback)`: Registers a listener for download progress updates.

### 2. Main Process Update Logic

#### [MODIFY] [index.js](file:///d:/sudhan_desktop/src/index.js)
- Register `ipcMain` handlers for version retrieval and update installations.
- Implement a robust `downloadFile` helper with chunk-based progress reporting and redirect handling.
- Downloads the installer from the GitHub `browser_download_url`, spawns it as a detached process, and terminates the Electron app to allow the installer to overwrite files.

### 3. Settings Page UI & Tab

#### [MODIFY] [settings.html](file:///d:/sudhan_desktop/backend/public/settings.html)
- Add a new "Application Updates" tab in the sidebar and main content section.
- Design a premium glassmorphic UI matching the dashboard:
  - **Current Version Card**: Displays local version, build details, and a pulsing status dot (Green for Up to Date, Orange for Update Available).
  - **Latest Release Panel**: Displays new release version (e.g. `v1.1.0`), release notes (markdown rendered), and release date.
  - **Download Progress**: Shows a custom animated progress bar during download.
  - **Action Button**: Clicking "Check for Updates" queries GitHub, and if a newer version exists, shows the update banner with a click-to-install button.

---

## Verification Plan

### Automated Tests
- Test that the GitHub API query retrieves release information successfully (if available) or handles the fallback gracefully.
- Verify the IPC handler compiles and runs cleanly.

### Manual Verification
- Access the Settings page, navigate to the Updates tab, and check for updates.
- Verify the UI correctly compares version names (e.g. `1.0.0` vs a mock release on GitHub) and displays release notes.
