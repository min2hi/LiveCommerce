const fs = require('fs');

const bumps = {
  'next': '16.2.10',
  'eslint-config-next': '16.2.10',
  'tailwindcss': '4.3.3',
  'lucide-react': '1.24.0',
  'openai': '6.48.0',
  'amqplib': '2.0.1',
  'redis': '6.1.0',
  'typescript': '5.7.2',
  'eslint': '9.0.0',
  'vitest': '2.1.8',
  '@vitest/ui': '2.1.8',
  '@tailwindcss/postcss': '4.3.3',
  '@tailwindcss/vite': '4.3.3'
};

const updateDeps = (deps) => {
  if (!deps) return false;
  let changed = false;
  for (const pkg in bumps) {
    if (deps[pkg]) {
      deps[pkg] = `^${bumps[pkg]}`;
      changed = true;
    }
  }
  return changed;
};

const processFile = (file) => {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const changed1 = updateDeps(data.dependencies);
  const changed2 = updateDeps(data.devDependencies);
  if (changed1 || changed2) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + file);
  }
};

processFile('package.json');
processFile('backend/package.json');
processFile('frontend/admin-panel/package.json');
processFile('frontend/buyer-app/package.json');
processFile('frontend/streamer-dashboard/package.json');
