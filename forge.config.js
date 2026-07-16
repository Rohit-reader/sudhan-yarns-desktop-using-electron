const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: 'backend/**/*', // Extract backend folder if it gets matched
    },
    extraResource: [
      'backend', // Copy backend to resources/backend
    ],
    ignore: (path) => {
      if (!path) return false;
      
      // Normalize backslashes to forward slashes for cross-platform compatibility
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Get the root path of the project (forge.config.js CWD)
      const rootPath = __dirname.replace(/\\/g, '/');
      const relativePath = normalizedPath.startsWith(rootPath)
        ? normalizedPath.substring(rootPath.length)
        : normalizedPath;
        
      // Folders/files to exclude from being packaged inside app.asar
      const excludePatterns = [
        /^\/python_folders([/\\].*)?$/,
        /^\/out([/\\].*)?$/,
        /^\/backend([/\\].*)?$/, // Exclude backend from app.asar since it's an extraResource
        /^\/\.git([/\\].*)?$/,
        /^\/\.gitignore$/,
        /\.spec$/,
        /\.md$/,
        /YarnRollTrackerApp\.spec/
      ];
      
      return excludePatterns.some(pattern => pattern.test(relativePath));
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
