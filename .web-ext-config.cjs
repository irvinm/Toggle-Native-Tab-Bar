module.exports = {
  ignoreFiles: [
    '**/*.psd',
    '**/*.psd.lnk',
    'scratch/',
    'AMO/',
    'package.json',
    'package-lock.json',
    'web-ext-artifacts/',
    '.gitignore',
    '.vscode/',
    '.github/',
    'MakeXPI.bat',
    'makefile',
    'README.md',
    'LICENSE',
    'demo/',
    'test/',
    'node_modules/',
    '.web-ext-config.cjs'
  ],
  build: {
    overwriteDest: true
  }
};
