const fs = require('fs');

const replaceInFile = (file, replacements) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [search, replace] of Object.entries(replacements)) {
    if (content.includes(search)) {
      content = content.replace(new RegExp(search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
};

const replacements = {
  'actions/checkout@v4': 'actions/checkout@v7',
  'actions/upload-artifact@v4': 'actions/upload-artifact@v7',
  'docker/build-push-action@v5': 'docker/build-push-action@v7',
  'docker/metadata-action@v5': 'docker/metadata-action@v6',
  'gitleaks/gitleaks-action@v2': 'gitleaks/gitleaks-action@v3'
};

replaceInFile('.github/workflows/ci.yml', replacements);
replaceInFile('.github/workflows/cd.yml', replacements);
replaceInFile('.github/workflows/security.yml', replacements);
