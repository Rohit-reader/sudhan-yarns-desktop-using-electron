const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const targetPath = path.join(context.appOutDir, 'resources', 'backend', 'node_modules');
  const sourcePath = path.join(context.packager.projectDir, 'backend', 'node_modules');
  
  if (fs.existsSync(sourcePath)) {
    console.log(`Copying backend node_modules from ${sourcePath} to ${targetPath}`);
    fs.cpSync(sourcePath, targetPath, { recursive: true });
    console.log('Successfully copied backend node_modules!');
  } else {
    console.warn('Backend node_modules not found. Backend server may fail to start.');
  }
};
